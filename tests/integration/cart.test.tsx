import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProductDetailPage } from "../../src/features/catalogue/components/ProductDetailPage";
import { server } from "../../src/mocks/server";
import { CartPage } from "../../src/pages/CartPage";
import { useCartStore } from "../../src/stores/cart-store";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderProductDetail(productId: string, queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/products/${productId}`]}>
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderCartPage() {
  const qc = createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/cart"]}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/products" element={<div>Products page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  // Reset cart state between tests
  useCartStore.setState({ items: [] });
});

// ─── TS-001-008 ───────────────────────────────────────────────────────────────

describe("TS-001-008", () => {
  it("add new SKU to cart creates cart entry with quantity 1", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("*/products/prod-tshirt", () => {
        return HttpResponse.json({
          id: "prod-tshirt",
          name: "Classic T-Shirt",
          description: null,
          image_url: null,
          skus: [{ id: "sku-a", label: "Small", price_minor: 2999, stock_level: 10 }],
          created_at: "2026-01-01T00:00:00Z",
        });
      })
    );

    renderProductDetail("prod-tshirt");

    await waitFor(() => {
      expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: "Add to Cart" });
    await user.click(addButton);

    const store = useCartStore.getState();
    expect(store.items).toHaveLength(1);
    expect(store.items[0].sku_id).toBe("sku-a");
    expect(store.items[0].quantity).toBe(1);
    expect(store.items[0].product_name).toBe("Classic T-Shirt");
    expect(store.items[0].variant_label).toBe("Small");
    expect(store.totalItems()).toBe(1);
  });
});

// ─── TS-001-009 ───────────────────────────────────────────────────────────────

describe("TS-001-009", () => {
  it("add existing SKU to cart increments quantity", async () => {
    const user = userEvent.setup();

    // Pre-seed the cart with SKU-A at quantity 1
    useCartStore.setState({
      items: [
        {
          sku_id: "sku-a",
          product_name: "Classic T-Shirt",
          variant_label: "Small",
          price_minor: 2999,
          quantity: 1,
          image_url: null,
        },
      ],
    });

    server.use(
      http.get("*/products/prod-tshirt", () => {
        return HttpResponse.json({
          id: "prod-tshirt",
          name: "Classic T-Shirt",
          description: null,
          image_url: null,
          skus: [{ id: "sku-a", label: "Small", price_minor: 2999, stock_level: 10 }],
          created_at: "2026-01-01T00:00:00Z",
        });
      })
    );

    renderProductDetail("prod-tshirt");

    await waitFor(() => {
      expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: "Add to Cart" });
    await user.click(addButton);

    const store = useCartStore.getState();
    // Still 1 line item (same SKU, quantity incremented)
    expect(store.items).toHaveLength(1);
    expect(store.items[0].sku_id).toBe("sku-a");
    expect(store.items[0].quantity).toBe(2);
    expect(store.totalItems()).toBe(2);
  });
});

// ─── TS-001-010 ───────────────────────────────────────────────────────────────

describe("TS-001-010", () => {
  it("cart displays items with names, quantities, prices and totals", () => {
    // Pre-seed cart with two items
    useCartStore.setState({
      items: [
        {
          sku_id: "sku-a",
          product_name: "Classic T-Shirt",
          variant_label: "Small",
          price_minor: 2999,
          quantity: 2,
          image_url: null,
        },
        {
          sku_id: "sku-b",
          product_name: "Denim Jacket",
          variant_label: "Medium",
          price_minor: 8999,
          quantity: 1,
          image_url: null,
        },
      ],
    });

    renderCartPage();

    // Product names
    expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Denim Jacket")).toBeInTheDocument();

    // Variant labels
    expect(screen.getByText("Small")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();

    // Quantities shown in input controls
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1")).toBeInTheDocument();

    // Unit prices
    expect(screen.getAllByText("$29.99").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$89.99").length).toBeGreaterThanOrEqual(1);

    // Subtotals: SKU-A: 2 × $29.99 = $59.98, SKU-B: 1 × $89.99 = $89.99
    expect(screen.getByText("$59.98")).toBeInTheDocument();
    // SKU-B unit price and subtotal are both $89.99 — just verify it appears
    expect(screen.getAllByText("$89.99").length).toBeGreaterThanOrEqual(1);

    // Cart total: $59.98 + $89.99 = $149.97
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$149.97");
  });
});

// ─── TS-001-015 ───────────────────────────────────────────────────────────────

describe("TS-001-015", () => {
  it("out-of-stock SKU shows disabled Add to Cart button and Out of stock indicator", async () => {
    const user = userEvent.setup();

    server.use(
      http.get("*/products/prod-oos", () => {
        return HttpResponse.json({
          id: "prod-oos",
          name: "Sold Out Sneaker",
          description: null,
          image_url: null,
          skus: [{ id: "sku-c", label: "Large", price_minor: 4999, stock_level: 0 }],
          created_at: "2026-01-01T00:00:00Z",
        });
      })
    );

    renderProductDetail("prod-oos");

    await waitFor(() => {
      expect(screen.getByText("Sold Out Sneaker")).toBeInTheDocument();
    });

    // "Out of stock" indicator shown
    expect(screen.getByText("Out of stock")).toBeInTheDocument();

    // Button disabled
    const button = screen.getByRole("button", { name: "Add to Cart" });
    expect(button).toBeDisabled();

    // Clicking disabled button does not add to cart
    await user.click(button);
    const store = useCartStore.getState();
    expect(store.items).toHaveLength(0);
  });
});
