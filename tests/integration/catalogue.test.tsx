import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProductDetailPage } from "../../src/features/catalogue/components/ProductDetailPage";
import { ProductListPage } from "../../src/features/catalogue/components/ProductListPage";
import { server } from "../../src/mocks/server";

// ─── Test helpers ────────────────────────────────────────────────────────────

function createWrapper(initialEntry = "/products") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return Wrapper;
}

function renderProductList(initialEntry = "/products") {
  return render(<ProductListPage />, { wrapper: createWrapper(initialEntry) });
}

function renderProductDetail(productId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/products/${productId}`]}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/products" element={<ProductListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ─── TS-001-001 ───────────────────────────────────────────────────────────────

describe("TS-001-001", () => {
  it("displays paginated product list with name, price, and image", async () => {
    const products = Array.from({ length: 20 }, (_, i) => ({
      id: `prod-${i + 1}`,
      name: `Product ${i + 1}`,
      description: `Description ${i + 1}`,
      image_url: `https://example.com/product-${i + 1}.jpg`,
      skus: [{ id: `sku-${i + 1}`, label: "Default", price_minor: 1999, stock_level: 5 }],
      created_at: "2026-01-01T00:00:00Z",
    }));

    server.use(
      http.get("*/products", ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get("page");
        const perPage = url.searchParams.get("per_page");
        if (page === "1" && perPage === "20") {
          return HttpResponse.json({
            data: products,
            meta: { total: 25, page: 1, per_page: 20 },
          });
        }
        return HttpResponse.json({ data: products, meta: { total: 25, page: 1, per_page: 20 } });
      })
    );

    renderProductList();

    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });

    // All 20 product cards rendered
    expect(screen.getAllByText(/^Product \d+$/).length).toBe(20);

    // Price formatted from price_minor
    expect(screen.getAllByText("$19.99").length).toBe(20);

    // Images rendered
    expect(screen.getAllByRole("img").length).toBe(20);

    // Pagination visible (total=25, per_page=20 → 2 pages)
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });
});

// ─── TS-001-002 ───────────────────────────────────────────────────────────────

describe("TS-001-002", () => {
  it("in-stock filter shows only products with available stock", async () => {
    server.use(
      http.get("*/products", ({ request }) => {
        const url = new URL(request.url);
        const inStockOnly = url.searchParams.get("in_stock_only");

        if (inStockOnly === "true") {
          return HttpResponse.json({
            data: [
              {
                id: "p1",
                name: "In Stock A",
                image_url: null,
                skus: [{ id: "s1", label: "S", price_minor: 2999, stock_level: 3 }],
                created_at: "2026-01-01T00:00:00Z",
              },
              {
                id: "p2",
                name: "In Stock B",
                image_url: null,
                skus: [{ id: "s2", label: "M", price_minor: 2999, stock_level: 7 }],
                created_at: "2026-01-01T00:00:00Z",
              },
              {
                id: "p3",
                name: "In Stock C",
                image_url: null,
                skus: [{ id: "s3", label: "L", price_minor: 3999, stock_level: 2 }],
                created_at: "2026-01-01T00:00:00Z",
              },
            ],
            meta: { total: 3, page: 1, per_page: 20 },
          });
        }

        return HttpResponse.json({
          data: [
            {
              id: "p1",
              name: "In Stock A",
              image_url: null,
              skus: [{ id: "s1", label: "S", price_minor: 2999, stock_level: 3 }],
              created_at: "2026-01-01T00:00:00Z",
            },
            {
              id: "p4",
              name: "Out of Stock",
              image_url: null,
              skus: [{ id: "s4", label: "S", price_minor: 1999, stock_level: 0 }],
              created_at: "2026-01-01T00:00:00Z",
            },
          ],
          meta: { total: 2, page: 1, per_page: 20 },
        });
      })
    );

    const user = userEvent.setup();
    renderProductList();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("In Stock A")).toBeInTheDocument();
    });

    // Enable in-stock filter
    const toggle = screen.getByLabelText("In stock only");
    await user.click(toggle);

    await waitFor(() => {
      expect(screen.getByText("In Stock B")).toBeInTheDocument();
    });

    // Should show exactly 3 products
    expect(screen.getByText("In Stock A")).toBeInTheDocument();
    expect(screen.getByText("In Stock B")).toBeInTheDocument();
    expect(screen.getByText("In Stock C")).toBeInTheDocument();
  });
});

// ─── TS-001-003 ───────────────────────────────────────────────────────────────

describe("TS-001-003", () => {
  it("pagination second page returns remaining 5 products", async () => {
    server.use(
      http.get("*/products", ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? 1);

        if (page === 1) {
          const firstPage = Array.from({ length: 20 }, (_, i) => ({
            id: `prod-${i + 1}`,
            name: `Product ${i + 1}`,
            image_url: null,
            skus: [{ id: `sku-${i + 1}`, label: "S", price_minor: 999, stock_level: 5 }],
            created_at: "2026-01-01T00:00:00Z",
          }));
          return HttpResponse.json({
            data: firstPage,
            meta: { total: 25, page: 1, per_page: 20 },
          });
        }

        if (page === 2) {
          const secondPage = Array.from({ length: 5 }, (_, i) => ({
            id: `prod-${i + 21}`,
            name: `Product ${i + 21}`,
            image_url: null,
            skus: [{ id: `sku-${i + 21}`, label: "S", price_minor: 999, stock_level: 5 }],
            created_at: "2026-01-01T00:00:00Z",
          }));
          return HttpResponse.json({
            data: secondPage,
            meta: { total: 25, page: 2, per_page: 20 },
          });
        }

        return HttpResponse.json({ data: [], meta: { total: 25, page, per_page: 20 } });
      })
    );

    const user = userEvent.setup();
    renderProductList();

    // Wait for page 1
    await waitFor(() => {
      expect(screen.getByText("Product 1")).toBeInTheDocument();
    });

    // Click "Next page"
    const nextBtn = screen.getByLabelText("Next page");
    await user.click(nextBtn);

    // Wait for page 2
    await waitFor(() => {
      expect(screen.getByText("Product 21")).toBeInTheDocument();
    });

    // Exactly 5 products on page 2
    expect(screen.getAllByText(/^Product 2\d$/).length).toBe(5);

    // Page 1 products gone
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
  });
});

// ─── TS-001-004 ───────────────────────────────────────────────────────────────

describe("TS-001-004", () => {
  it("product detail shows name, description, image and all SKU variants", async () => {
    const productId = "prod-tshirt";

    server.use(
      http.get(`*/products/${productId}`, () => {
        return HttpResponse.json({
          id: productId,
          name: "Classic T-Shirt",
          description: "A comfortable cotton tee",
          image_url: "https://example.com/tshirt.jpg",
          skus: [
            { id: "sku-s", label: "Small", price_minor: 2999, stock_level: 10 },
            { id: "sku-m", label: "Medium", price_minor: 2999, stock_level: 5 },
            { id: "sku-l", label: "Large", price_minor: 3499, stock_level: 0 },
          ],
          created_at: "2026-01-01T00:00:00Z",
        });
      })
    );

    renderProductDetail(productId);

    await waitFor(() => {
      expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    });

    // Description
    expect(screen.getByText("A comfortable cotton tee")).toBeInTheDocument();

    // Product image
    const img = screen.getByRole("img", { name: "Classic T-Shirt" });
    expect(img).toHaveAttribute("src", "https://example.com/tshirt.jpg");

    // All 3 SKU variants displayed
    expect(screen.getByText("Small")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();

    // Prices (Small+Medium same, Large different)
    expect(screen.getAllByText("$29.99").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("$34.99")).toBeInTheDocument();

    // Large is out of stock
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });
});

// ─── TS-001-005 ───────────────────────────────────────────────────────────────

describe("TS-001-005", () => {
  it("product detail shows SKU stock levels accurately — in stock vs out of stock", async () => {
    const productId = "prod-stock-test";

    server.use(
      http.get(`*/products/${productId}`, () => {
        return HttpResponse.json({
          id: productId,
          name: "Stock Test Product",
          description: null,
          image_url: null,
          skus: [
            { id: "sku-a", label: "SKU-A", price_minor: 1000, stock_level: 10 },
            { id: "sku-b", label: "SKU-B", price_minor: 1000, stock_level: 0 },
          ],
          created_at: "2026-01-01T00:00:00Z",
        });
      })
    );

    renderProductDetail(productId);

    await waitFor(() => {
      expect(screen.getByText("Stock Test Product")).toBeInTheDocument();
    });

    // SKU-A in stock
    expect(screen.getByText("In stock")).toBeInTheDocument();

    // SKU-B out of stock
    expect(screen.getByText("Out of stock")).toBeInTheDocument();

    // Add to Cart for SKU-B is disabled
    const buttons = screen.getAllByRole("button", { name: "Add to Cart" });
    const skuBButton = buttons[1]; // SKU-B is second
    expect(skuBButton).toBeDisabled();

    // Add to Cart for SKU-A is enabled
    const skuAButton = buttons[0];
    expect(skuAButton).not.toBeDisabled();
  });
});

// ─── TS-001-006 ───────────────────────────────────────────────────────────────

describe("TS-001-006", () => {
  it("empty catalogue shows 'No products available' instead of empty grid", async () => {
    server.use(
      http.get("*/products", () => {
        return HttpResponse.json({
          data: [],
          meta: { total: 0, page: 1, per_page: 20 },
        });
      })
    );

    renderProductList();

    await waitFor(() => {
      expect(screen.getByText("No products available")).toBeInTheDocument();
    });

    // No product cards
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

// ─── TS-001-007 ───────────────────────────────────────────────────────────────

describe("TS-001-007", () => {
  it("non-existent product shows 'Product not found' with link back to catalogue", async () => {
    const nonExistentId = "does-not-exist";

    server.use(
      http.get(`*/products/${nonExistentId}`, () => {
        return HttpResponse.json(
          { code: "NOT_FOUND", message: "Product not found" },
          { status: 404 }
        );
      })
    );

    renderProductDetail(nonExistentId);

    await waitFor(() => {
      expect(screen.getByText("Product not found")).toBeInTheDocument();
    });

    // Link back to catalogue
    const link = screen.getByRole("link", { name: /back to catalogue/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/products");
  });
});
