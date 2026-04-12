import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { server } from "../../src/mocks/server";
import { CheckoutPage } from "../../src/pages/CheckoutPage";
import { OrderConfirmationPage } from "../../src/pages/OrderConfirmationPage";
import { useCartStore } from "../../src/stores/cart-store";
import { useCheckoutStore } from "../../src/stores/checkout-store";

// ─── Mock Stripe ──────────────────────────────────────────────────────────────

vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CardElement: ({
    onChange,
  }: { onChange?: (e: { complete: boolean; error?: unknown }) => void }) => (
    <input
      data-testid="card-element"
      onChange={(e) => onChange?.({ complete: e.target.value.length > 0, error: undefined })}
    />
  ),
  useStripe: () => ({
    createPaymentMethod: vi.fn().mockResolvedValue({ paymentMethod: { id: "pm_test_xxx" } }),
  }),
  useElements: () => ({
    getElement: vi.fn().mockReturnValue({}),
  }),
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderCheckoutWithConfirmation(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/cart" element={<div>Cart Page</div>} />
          <Route path="/products" element={<div>Products Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderConfirmationPage(order: unknown, queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[{ pathname: "/checkout/confirmation", state: { order } }]}>
        <Routes>
          <Route path="/checkout/confirmation" element={<OrderConfirmationPage />} />
          <Route path="/products" element={<div>Products Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function seedCheckoutStep3() {
  useCartStore.setState({
    items: [
      {
        sku_id: "sku-1",
        product_name: "Classic T-Shirt",
        variant_label: "Small",
        price_minor: 2999,
        quantity: 2,
        image_url: null,
      },
    ],
  });
  useCheckoutStore.getState().setSessionToken("session-token-abc", "2026-12-31T23:59:59Z");
  useCheckoutStore.getState().setShippingAddress({
    line1: "123 Main St",
    city: "Springfield",
    postal_code: "12345",
    country_code: "US",
  });
  useCheckoutStore.getState().setShippingMethodId("sm-1");
  useCheckoutStore.getState().setCurrentStep(3);
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
  useCheckoutStore.getState().resetCheckout();
});

// ─── TS-001-021 ───────────────────────────────────────────────────────────────

describe("TS-001-021", () => {
  it("successful order returns 201 — navigates to confirmation, cart cleared", async () => {
    const user = userEvent.setup();

    const mockOrder = {
      id: "order-uuid",
      reference: "ORD-20260411-A3K9",
      status: "confirmed",
      lines: [
        {
          sku_id: "sku-1",
          product_name: "Classic T-Shirt",
          variant_label: "Small",
          quantity: 2,
          unit_price: 2999,
          subtotal: 5998,
        },
      ],
      total: 7497,
      created_at: "2026-04-11T10:00:00Z",
    };

    server.use(
      http.post("*/checkout/guest/orders", () => {
        return HttpResponse.json(mockOrder, { status: 201 });
      })
    );

    seedCheckoutStep3();
    renderCheckoutWithConfirmation();

    // Fill card element to enable Place Order
    const cardInput = screen.getByTestId("card-element");
    await user.type(cardInput, "4");

    // Fill email
    const emailInput = screen.getByLabelText(/email address/i);
    await user.clear(emailInput);
    await user.type(emailInput, "test@example.com");

    // Click Place Order
    const placeOrderBtn = screen.getByRole("button", { name: /place order/i });
    await user.click(placeOrderBtn);

    // Navigated to confirmation page
    await waitFor(() => {
      expect(screen.getByTestId("order-reference")).toHaveTextContent("ORD-20260411-A3K9");
    });

    // Order total displayed
    expect(screen.getByTestId("order-total")).toHaveTextContent("$74.97");

    // Cart cleared
    const cartState = useCartStore.getState();
    expect(cartState.items).toHaveLength(0);
  });
});

// ─── TS-001-024 ───────────────────────────────────────────────────────────────

describe("TS-001-024", () => {
  it("confirmation page displays order reference, items, total, and Continue Shopping link", () => {
    const mockOrder = {
      id: "order-uuid",
      reference: "ORD-20260411-A3K9",
      status: "confirmed",
      lines: [
        {
          sku_id: "sku-1",
          product_name: "Classic T-Shirt",
          variant_label: "Small",
          quantity: 2,
          unit_price: 2999,
          subtotal: 5998,
        },
      ],
      total: 7497,
      created_at: "2026-04-11T10:00:00Z",
    };

    renderConfirmationPage(mockOrder);

    // Order reference displayed prominently
    expect(screen.getByTestId("order-reference")).toHaveTextContent("ORD-20260411-A3K9");

    // Line item: product name and quantity
    expect(screen.getByText("Classic T-Shirt")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    // Total formatted as currency
    expect(screen.getByTestId("order-total")).toHaveTextContent("$74.97");

    // Continue Shopping link available
    const continueLink = screen.getByRole("link", { name: /continue shopping/i });
    expect(continueLink).toBeInTheDocument();
    expect(continueLink).toHaveAttribute("href", "/products");
  });
});

// ─── TS-001-025 ───────────────────────────────────────────────────────────────

describe("TS-001-025", () => {
  it("422 with single field error shows field-level error on postal code field", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/orders", () => {
        return HttpResponse.json(
          {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: [{ field: "shipping_address.postal_code", issue: "Postal code is required" }],
          },
          { status: 422 }
        );
      })
    );

    seedCheckoutStep3();
    renderCheckoutWithConfirmation();

    // Fill card element and email to enable Place Order
    const cardInput = screen.getByTestId("card-element");
    await user.type(cardInput, "4");
    const emailInput = screen.getByLabelText(/email address/i);
    await user.clear(emailInput);
    await user.type(emailInput, "test@example.com");

    // Click Place Order
    const placeOrderBtn = screen.getByRole("button", { name: /place order/i });
    await user.click(placeOrderBtn);

    // User navigated back to step 1 — postal code error visible
    await waitFor(() => {
      expect(screen.getByText("Postal code is required")).toBeInTheDocument();
    });

    // User stays on checkout form (not on confirmation)
    expect(screen.queryByTestId("order-reference")).not.toBeInTheDocument();

    // Still on checkout — address form heading visible
    expect(screen.getByRole("heading", { name: /shipping address/i })).toBeInTheDocument();
  });
});

// ─── TS-001-026 ───────────────────────────────────────────────────────────────

describe("TS-001-026", () => {
  it("422 with multiple validation errors shows all field-level errors simultaneously", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/orders", () => {
        return HttpResponse.json(
          {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: [
              { field: "email", issue: "Email is required" },
              { field: "shipping_address.line1", issue: "Address line 1 is required" },
              { field: "shipping_address.postal_code", issue: "Postal code is required" },
            ],
          },
          { status: 422 }
        );
      })
    );

    seedCheckoutStep3();
    renderCheckoutWithConfirmation();

    // Fill card element and email
    const cardInput = screen.getByTestId("card-element");
    await user.type(cardInput, "4");
    const emailInput = screen.getByLabelText(/email address/i);
    await user.clear(emailInput);
    await user.type(emailInput, "test@example.com");

    // Click Place Order
    await user.click(screen.getByRole("button", { name: /place order/i }));

    // Navigated to step 1 (earliest errored step = shipping_address fields)
    await waitFor(() => {
      expect(screen.getByText("Address line 1 is required")).toBeInTheDocument();
    });
    expect(screen.getByText("Postal code is required")).toBeInTheDocument();

    // User is not on confirmation page
    expect(screen.queryByTestId("order-reference")).not.toBeInTheDocument();
  });
});
