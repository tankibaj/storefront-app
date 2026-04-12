import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CartPage } from "../../src/pages/CartPage";
import { useCartStore } from "../../src/stores/cart-store";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function renderCartPage() {
  return render(
    <MemoryRouter initialEntries={["/cart"]}>
      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products" element={<div>Products page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  // Reset cart state between tests. Persist will write empty state to localStorage,
  // then afterEach in setup.ts resets localStorage.
  useCartStore.setState({ items: [] });
});

// ─── TS-001-011 ───────────────────────────────────────────────────────────────

describe("TS-001-011", () => {
  it("change item quantity recalculates subtotal and total", async () => {
    // Precondition: cart with SKU-A (qty 2, $29.99) and SKU-B (qty 1, $89.99)
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

    // Initial cart total: 2×$29.99 + 1×$89.99 = $149.97
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$149.97");

    // Find the quantity input for SKU-A (first row) and change to 3
    const qtyInputs = screen.getAllByLabelText("Quantity");
    const skuAInput = qtyInputs[0];

    // Use fireEvent.change to reliably set a numeric input value
    fireEvent.change(skuAInput, { target: { value: "3" } });

    await waitFor(() => {
      // SKU-A subtotal: 3 × $29.99 = $89.97
      expect(screen.getByText("$89.97")).toBeInTheDocument();
    });

    // Updated total: 3×$29.99 + 1×$89.99 = $179.96
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$179.96");
  });
});

// ─── TS-001-012 ───────────────────────────────────────────────────────────────

describe("TS-001-012", () => {
  it("remove item from cart updates total", async () => {
    const user = userEvent.setup();

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

    // Both items present
    expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Denim Jacket")).toBeInTheDocument();

    // Click "Remove" for Denim Jacket (SKU-B, second row)
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await user.click(removeButtons[1]); // second remove button = SKU-B

    await waitFor(() => {
      expect(screen.queryByText("Denim Jacket")).not.toBeInTheDocument();
    });

    // Only SKU-A remains
    expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBe(2); // 1 header row + 1 data row

    // Total updated to SKU-A only: 2 × $29.99 = $59.98
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$59.98");
  });
});

// ─── TS-001-013 ───────────────────────────────────────────────────────────────

describe("TS-001-013", () => {
  it("removing last item shows empty cart state", async () => {
    const user = userEvent.setup();

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

    renderCartPage();

    expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();

    // Remove the only item
    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    });

    // "Browse products" link points to /products
    const browseLink = screen.getByRole("link", { name: /browse products/i });
    expect(browseLink).toBeInTheDocument();
    expect(browseLink).toHaveAttribute("href", "/products");

    // Cart totalItems is 0
    expect(useCartStore.getState().totalItems()).toBe(0);
  });
});

// ─── TS-001-014 ───────────────────────────────────────────────────────────────

describe("TS-001-014", () => {
  it("cart survives page refresh — items rehydrate from localStorage", async () => {
    // Simulate a page refresh: set store to empty first (beforeEach did this),
    // then seed localStorage AFTER (so persist can't overwrite our seed),
    // then trigger rehydrate.

    // Step 1: Ensure store is empty (done in beforeEach)
    expect(useCartStore.getState().items).toHaveLength(0);

    // Step 2: Seed localStorage with persisted cart state (matching Zustand persist format)
    const persistedState = {
      state: {
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
      },
      version: 1,
    };
    localStorage.setItem("storefront-cart", JSON.stringify(persistedState));

    // Step 3: Trigger rehydration from localStorage
    await useCartStore.persist.rehydrate();

    // After rehydration, cart should contain the persisted items
    const store = useCartStore.getState();
    expect(store.items).toHaveLength(2);
    expect(store.items[0].sku_id).toBe("sku-a");
    expect(store.items[0].quantity).toBe(2);
    expect(store.items[1].sku_id).toBe("sku-b");
    expect(store.items[1].quantity).toBe(1);

    // Render the cart page to verify it shows the rehydrated items
    renderCartPage();

    expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("Denim Jacket")).toBeInTheDocument();
    expect(screen.getByTestId("cart-total")).toHaveTextContent("$149.97");
  });
});
