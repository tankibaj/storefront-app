#!/usr/bin/env node
/**
 * Generate route and consumed-endpoint manifests from source code.
 * Zero dependencies — uses only Node.js built-ins.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

// ── Helpers ──────────────────────────────────────────────────────────────────

function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, exts));
    else if (exts.includes(extname(entry.name))) out.push(full);
  }
  return out;
}

function serviceFromEnv(envVar) {
  if (/INVENTORY/i.test(envVar)) return "inventory-service";
  if (/ORDER/i.test(envVar)) return "order-service";
  if (/NOTIFICATION/i.test(envVar)) return "notification-service";
  if (/API_BASE/i.test(envVar)) return "order-service";
  return "unknown";
}

// ── Routes ───────────────────────────────────────────────────────────────────

function extractRoutes() {
  const content = readFileSync(join(SRC, "App.tsx"), "utf-8");

  // Collect paths nested under <RequireAuth>
  const authPaths = new Set();
  const authBlock = content.match(
    /<Route\s+element=\{<RequireAuth\s*\/?>}>([\s\S]*?)<\/Route>/
  );
  if (authBlock) {
    for (const m of authBlock[1].matchAll(/path="([^"]+)"/g)) {
      authPaths.add(m[1]);
    }
  }

  const routes = [];
  const re = /<Route\s+path="([^"]+)"\s+element=\{<(\w+)(?:\s[^}]*)?\s*\/?>}\s*\/>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const [, path, component] = m;
    const isRedirect = component === "Navigate";
    const to = isRedirect
      ? content.slice(m.index).match(/to="([^"]+)"/)?.[1]
      : null;
    routes.push({
      path,
      component: isRedirect ? `\u2192 ${to}` : component,
      auth: authPaths.has(path),
    });
  }
  return routes;
}

// ── Consumed Endpoints ───────────────────────────────────────────────────────

function extractEndpoints() {
  const files = walk(SRC, [".ts", ".tsx"]).filter(
    (f) =>
      !f.includes(".test.") &&
      !f.includes("/mocks/") &&
      !f.includes("/test/")
  );

  const endpoints = [];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const rel = relative(ROOT, file);

    // Only process files that define a base URL (VITE_*URL)
    const envHit = content.match(
      /import\.meta\.env\??\.(\bVITE_\w*(?:URL|BASE_URL)\b)/
    );
    if (!envHit) continue;
    const service = serviceFromEnv(envHit[1]);

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const ctx = lines.slice(i, Math.min(i + 5, lines.length)).join(" ");

      let path = null;
      let method = "GET";

      // ── Pattern A: wrapper call (apiFetch / orderFetch) ──
      // Use single line for path extraction to avoid bleeding into adjacent calls.
      // Use multi-line ctx only for method detection below.
      if (/(?:apiFetch|orderFetch)/.test(line)) {
        const quoted = line.match(
          /(?:apiFetch|orderFetch)\s*(?:<[^>]*>)?\s*\(\s*["'](\/[^"']+)["']/
        );
        if (quoted) {
          path = quoted[1];
        } else {
          const simple = line.match(
            /(?:apiFetch|orderFetch)\s*(?:<[^>]*>)?\s*\(\s*`(\/(?:[^`$]|\$\{\w+\})*)`/
          );
          if (simple) {
            path = simple[1]
              .replace(/\$\{(\w+)\}/g, ":$1")
              .split("?")[0];
          } else {
            const prefix = line.match(
              /(?:apiFetch|orderFetch)\s*(?:<[^>]*>)?\s*\(\s*`(\/[^`$]*)/
            );
            if (prefix) path = prefix[1];
          }
        }
      }

      // ── Pattern B: direct fetch(`${BASE}/path`) ──
      if (
        !path &&
        /fetch\s*\(/.test(line) &&
        !/(?:apiFetch|orderFetch)/.test(line)
      ) {
        const direct = ctx.match(/fetch\s*\(\s*`\$\{[^}]+\}(\/[^`]*)`/);
        if (direct) {
          path = direct[1]
            .replace(/\$\{(\w+)\}/g, ":$1")
            .split("?")[0];
        }

        // Pattern C: fetch(urlVar) — look upward for URL construction
        if (!path && /fetch\s*\(\s*\w+/.test(line)) {
          for (let j = Math.max(0, i - 10); j < i; j++) {
            const hit = lines[j].match(
              /new URL\s*\(\s*`\$\{[^}]+\}(\/[^`]*)`/
            );
            if (hit) {
              path = hit[1]
                .replace(/\$\{(\w+)\}/g, ":$1")
                .split("?")[0];
              break;
            }
          }
        }
      }

      if (!path) continue;
      path = path.replace(/\/+$/, "") || "/";

      if (/method:\s*["']POST["']/.test(ctx)) method = "POST";
      else if (/method:\s*["']PUT["']/.test(ctx)) method = "PUT";
      else if (/method:\s*["']PATCH["']/.test(ctx)) method = "PATCH";
      else if (/method:\s*["']DELETE["']/.test(ctx)) method = "DELETE";

      endpoints.push({ method, path, service, source: rel });
    }
  }

  // Deduplicate
  const seen = new Set();
  return endpoints.filter((e) => {
    const key = `${e.method} ${e.path} ${e.service}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Generate ─────────────────────────────────────────────────────────────────

const routes = extractRoutes();
const endpoints = extractEndpoints();

const routesMd = [
  "# Routes",
  "",
  "> Auto-generated from `src/App.tsx`. Do not edit manually.",
  "",
  "| Path | Component | Auth |",
  "|---|---|---|",
  ...routes.map(
    (r) => `| \`${r.path}\` | ${r.component} | ${r.auth ? "Yes" : ""} |`
  ),
  "",
].join("\n");

const byService = {};
for (const e of endpoints) (byService[e.service] ||= []).push(e);

const epLines = [
  "# Consumed Endpoints",
  "",
  "> Auto-generated from source. Do not edit manually.",
  "",
];
for (const [svc, eps] of Object.entries(byService).sort()) {
  epLines.push(`## ${svc}`, "", "| Method | Path | Source |", "|---|---|---|");
  for (const e of eps) epLines.push(`| ${e.method} | \`${e.path}\` | \`${e.source}\` |`);
  epLines.push("");
}

mkdirSync(join(ROOT, "docs"), { recursive: true });
writeFileSync(join(ROOT, "docs/routes.md"), routesMd);
writeFileSync(join(ROOT, "docs/consumed-endpoints.md"), epLines.join("\n"));

console.log(`Wrote docs/routes.md (${routes.length} routes)`);
console.log(`Wrote docs/consumed-endpoints.md (${endpoints.length} endpoints)`);
