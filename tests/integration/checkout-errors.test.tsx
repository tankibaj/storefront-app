import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { server } from "../../src/mocks/server";
import { CartPage } from "../../src/pages/CartPage";
import { CheckoutPage } from "../../src/pages/CheckoutPage";
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

function renderCheckoutWithCart(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/products" element={<div>Products Page</div>} />
          <Route path="/checkout/confirmation" element={<div>Confirmation Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function seedCheckoutStep3WithSkuId(skuId = "sku-1") {
  useCartStore.setState({
    items: [
      {
        sku_id: skuId,
        product_name: "Classic T-Shirt",
        variant_label: "Small",
        price_minor: 2999,
        quantity: 5,
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

async function fillAndClickPlaceOrder(user: ReturnType<typeof userEvent.setup>) {
  const cardInput = screen.getByTestId("card-element");
  await user.type(cardInput, "4");
  const emailInput = screen.getByLabelText(/email address/i);
  await user.clear(emailInput);
  await user.type(emailInput, "test@example.com");
  await user.click(screen.getByRole("button", { name: /place order/i }));
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
  useCheckoutStore.getState().resetCheckout();
});

// ─── TS-001-029 ───────────────────────────────────────────────────────────────

describe("TS-001-029", () => {
  it("UI displays stock conflict with affected items and Return to Cart button", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/orders", () => {
        return HttpResponse.json(
          {
            code: "STOCK_CONFLICT",
            message: "Insufficient stock",
            conflicts: [{ sku_id: "sku-1", requested: 5, available: 2 }],
          },
          { status: 409 }
        );
      })
    );

    seedCheckoutStep3WithSkuId("sku-1");
    renderCheckoutWithCart();

    await fillAndClickPlaceOrder(user);

    // Stock conflict error message shown
    await waitFor(() => {
      expect(
        screen.getByText(
          /Only 2 units? of Classic T-Shirt \(Small\) available \(you requested 5\)/i
        )
      ).toBeInTheDocument();
    });

    // Return to Cart button is visible
    expect(screen.getByRole("button", { name: /return to cart/i })).toBeInTheDocument();
  });
});

// ─── TS-001-030 ───────────────────────────────────────────────────────────────

describe("TS-001-030", () => {
  it("payment failure shows 'Payment could not be processed' message, Place Order re-enabled", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/orders", () => {
        return HttpResponse.json(
          { code: "PAYMENT_FAILED", message: "Payment processing failed" },
          { status: 502 }
        );
      })
    );

    seedCheckoutStep3WithSkuId("sku-1");
    renderCheckoutWithCart();

    await fillAndClickPlaceOrder(user);

    // Payment error message shown
    await waitFor(() => {
      expect(
        screen.getByText(
          /Payment could not be processed\. Please try again or use a different payment method\./i
        )
      ).toBeInTheDocument();
    });

    // Place Order button re-enabled (not disabled)
    const placeOrderBtn = screen.getByRole("button", { name: /place order/i });
    expect(placeOrderBtn).not.toBeDisabled();
  });
});

// ─── TS-001-032 ───────────────────────────────────────────────────────────────

describe("TS-001-032", () => {
  it("expired session returns 401 — displays 'Your session has expired.', resets state, offers Return to Cart", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/orders", () => {
        return HttpResponse.json(
          { code: "SESSION_EXPIRED", message: "Guest session has expired" },
          { status: 401 }
        );
      })
    );

    seedCheckoutStep3WithSkuId("sku-1");
    renderCheckoutWithCart();

    await fillAndClickPlaceOrder(user);

    // Session expired message shown
    await waitFor(() => {
      expect(screen.getByText("Your session has expired.")).toBeInTheDocument();
    });

    // Checkout state is reset (session token cleared)
    const state = useCheckoutStore.getState();
    expect(state.sessionToken).toBeNull();

    // "Return to Cart" button available for the user to navigate away
    expect(screen.getByRole("button", { name: /return to cart/i })).toBeInTheDocument();

    // Checkout form (step 3 payment form) is no longer visible
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();

    // Click Return to Cart navigates to /cart
    await user.click(screen.getByRole("button", { name: /return to cart/i }));
    await waitFor(() => {
      // CartPage is now rendered
      expect(screen.queryByText("Your session has expired.")).not.toBeInTheDocument();
    });
  });
});

// ─── TS-001-033 ───────────────────────────────────────────────────────────────

describe("TS-001-033", () => {
  it("invalid session returns 401 — displays 'Your session has expired.', resets state, offers Return to Cart", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/orders", () => {
        return HttpResponse.json(
          { code: "INVALID_SESSION", message: "Invalid session token" },
          { status: 401 }
        );
      })
    );

    seedCheckoutStep3WithSkuId("sku-1");
    renderCheckoutWithCart();

    await fillAndClickPlaceOrder(user);

    // Session expired message shown (same message regardless of EXPIRED vs INVALID code)
    await waitFor(() => {
      expect(screen.getByText("Your session has expired.")).toBeInTheDocument();
    });

    // Checkout state is reset
    const state = useCheckoutStore.getState();
    expect(state.sessionToken).toBeNull();

    // Return to Cart button available
    expect(screen.getByRole("button", { name: /return to cart/i })).toBeInTheDocument();
  });
});
