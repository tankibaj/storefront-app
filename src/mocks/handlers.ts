import { http, HttpResponse } from "msw";
import type { GuestSession, Product, ProductPage, ShippingMethod } from "../types/api";

// ─── Inventory service handlers ───────────────────────────────────────────────

const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "Classic T-Shirt",
    description: "A comfortable cotton tee",
    image_url: "https://example.com/tshirt.jpg",
    skus: [
      { id: "sku-s", label: "Small", price_minor: 2999, stock_level: 10 },
      { id: "sku-m", label: "Medium", price_minor: 2999, stock_level: 5 },
      { id: "sku-l", label: "Large", price_minor: 3499, stock_level: 0 },
    ],
    created_at: "2026-01-01T00:00:00Z",
  },
];

// ─── Order service / checkout handlers ───────────────────────────────────────

const mockGuestSession: GuestSession = {
  id: "session-uuid-001",
  token: "session-token-abc",
  expires_at: "2026-04-12T23:59:59Z",
};

const mockShippingMethods: ShippingMethod[] = [
  {
    id: "sm-1",
    name: "Standard Shipping",
    description: "3-5 business days",
    cost_minor: 599,
    estimated_days_min: 3,
    estimated_days_max: 5,
  },
  {
    id: "sm-2",
    name: "Express Shipping",
    description: "1-2 business days",
    cost_minor: 1499,
    estimated_days_min: 1,
    estimated_days_max: 2,
  },
];

export const checkoutHandlers = [
  http.post("*/checkout/guest/sessions", () => {
    return HttpResponse.json(mockGuestSession, { status: 201 });
  }),

  http.get("*/checkout/shipping-methods", () => {
    return HttpResponse.json(mockShippingMethods);
  }),
];

export const handlers = [
  ...checkoutHandlers,

  http.get("*/products/:productId", ({ request, params }) => {
    const tenantId = request.headers.get("X-Tenant-ID");
    if (!tenantId) {
      return HttpResponse.json(
        { code: "BAD_REQUEST", message: "Missing X-Tenant-ID header" },
        { status: 400 }
      );
    }
    const product = mockProducts.find((p) => p.id === params.productId);
    if (!product) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Product not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json(product);
  }),

  http.get("*/products", ({ request }) => {
    const tenantId = request.headers.get("X-Tenant-ID");
    if (!tenantId) {
      return HttpResponse.json(
        { code: "BAD_REQUEST", message: "Missing X-Tenant-ID header" },
        { status: 400 }
      );
    }
    const url = new URL(request.url);
    const inStockOnly = url.searchParams.get("in_stock_only") === "true";

    let products = mockProducts;
    if (inStockOnly) {
      products = products.filter((p) => p.skus.some((s) => s.stock_level > 0));
    }

    const page = Number(url.searchParams.get("page") ?? 1);
    const perPage = Number(url.searchParams.get("per_page") ?? 20);

    const result: ProductPage = {
      data: products,
      meta: { total: products.length, page, per_page: perPage },
    };
    return HttpResponse.json(result);
  }),
];
