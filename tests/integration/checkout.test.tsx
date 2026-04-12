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
    createPaymentMethod: vi.fn().mockResolvedValue({ paymentMethod: { id: "pm-test-token" } }),
  }),
  useElements: () => ({
    getElement: vi.fn(),
  }),
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function renderCartPage(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/cart"]}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function renderCheckoutPage(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/checkout"]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function seedCartWithItems() {
  useCartStore.setState({
    items: [
      {
        sku_id: "sku-test-1",
        product_name: "Test Product",
        variant_label: "Medium",
        price_minor: 2999,
        quantity: 1,
        image_url: null,
      },
    ],
  });
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
  useCheckoutStore.getState().resetCheckout();
});

// ─── TS-001-016 ───────────────────────────────────────────────────────────────

describe("TS-001-016", () => {
  it("POST /checkout/guest/sessions creates a guest session and stores token", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/sessions", () => {
        return HttpResponse.json(
          { id: "uuid", token: "session-token-abc", expires_at: "2026-04-12T23:59:59Z" },
          { status: 201 }
        );
      })
    );

    seedCartWithItems();
    renderCartPage();

    const checkoutBtn = screen.getByRole("button", { name: /checkout/i });
    await user.click(checkoutBtn);

    // Wait for navigation to checkout page and session stored
    await waitFor(() => {
      const state = useCheckoutStore.getState();
      expect(state.sessionToken).toBe("session-token-abc");
    });

    // User navigated to checkout step 1 — verify address form heading is present
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Shipping Address/i })).toBeInTheDocument();
    });
  });
});

// ─── TS-001-017 ───────────────────────────────────────────────────────────────

describe("TS-001-017", () => {
  it("X-Guest-Session-Token header included in subsequent checkout API calls", async () => {
    const capturedHeaders: Record<string, string | null> = {};

    server.use(
      http.post("*/checkout/guest/sessions", () => {
        return HttpResponse.json(
          { id: "uuid", token: "session-token-abc", expires_at: "2026-04-12T23:59:59Z" },
          { status: 201 }
        );
      }),
      http.get("*/checkout/shipping-methods", ({ request }) => {
        capturedHeaders["X-Guest-Session-Token"] = request.headers.get("X-Guest-Session-Token");
        return HttpResponse.json([
          {
            id: "sm-1",
            name: "Standard Shipping",
            description: "3-5 business days",
            cost_minor: 599,
            estimated_days_min: 3,
            estimated_days_max: 5,
          },
        ]);
      })
    );

    // Pre-seed session token in checkout store
    useCheckoutStore.getState().setSessionToken("session-token-abc", "2026-04-12T23:59:59Z");
    useCheckoutStore.getState().setCurrentStep(2);
    seedCartWithItems();

    renderCheckoutPage();

    // Wait for shipping methods to be fetched
    await waitFor(() => {
      expect(capturedHeaders["X-Guest-Session-Token"]).toBe("session-token-abc");
    });
  });
});

// ─── TS-001-018 ───────────────────────────────────────────────────────────────

describe("TS-001-018", () => {
  it("shipping methods displayed with name, price, and estimated delivery", async () => {
    server.use(
      http.get("*/checkout/shipping-methods", () => {
        return HttpResponse.json([
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
        ]);
      })
    );

    // Pre-seed session and navigate to step 2
    useCheckoutStore.getState().setSessionToken("session-token-abc", "2026-04-12T23:59:59Z");
    useCheckoutStore.getState().setCurrentStep(2);
    seedCartWithItems();

    renderCheckoutPage();

    // Both options displayed
    await waitFor(() => {
      expect(screen.getByText("Standard Shipping")).toBeInTheDocument();
      expect(screen.getByText("Express Shipping")).toBeInTheDocument();
    });

    // Prices formatted correctly
    expect(screen.getByText("$5.99")).toBeInTheDocument();
    expect(screen.getByText("$14.99")).toBeInTheDocument();

    // Delivery estimates shown
    expect(screen.getByText(/3–5 business days/i)).toBeInTheDocument();
    expect(screen.getByText(/1–2 business days/i)).toBeInTheDocument();
  });
});

// ─── TS-001-019 ───────────────────────────────────────────────────────────────

describe("TS-001-019", () => {
  it("checkout renders multi-step UI with address fields, shipping selector, payment form", async () => {
    const user = userEvent.setup();

    server.use(
      http.post("*/checkout/guest/sessions", () => {
        return HttpResponse.json(
          { id: "uuid", token: "session-token-abc", expires_at: "2026-04-12T23:59:59Z" },
          { status: 201 }
        );
      }),
      http.get("*/checkout/shipping-methods", () => {
        return HttpResponse.json([
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
        ]);
      })
    );

    seedCartWithItems();
    renderCartPage();

    // Click checkout to create session and navigate
    const checkoutBtn = screen.getByRole("button", { name: /checkout/i });
    await user.click(checkoutBtn);

    // Step 1: address fields
    await waitFor(() => {
      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();

    // Fill step 1 and proceed
    await user.type(screen.getByLabelText(/address line 1/i), "123 Main St");
    await user.type(screen.getByLabelText(/city/i), "Springfield");
    await user.type(screen.getByLabelText(/postal code/i), "12345");
    await user.selectOptions(screen.getByLabelText(/country/i), "US");
    await user.click(screen.getByRole("button", { name: /continue to shipping/i }));

    // Step 2: shipping method selector with 2 options
    await waitFor(() => {
      expect(screen.getByText("Standard Shipping")).toBeInTheDocument();
      expect(screen.getByText("Express Shipping")).toBeInTheDocument();
    });

    // Select a method and proceed
    await user.click(screen.getByRole("radio", { name: /standard shipping/i }));
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    // Step 3: payment form
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByTestId("card-element")).toBeInTheDocument();
    });

    // Place Order button disabled until all complete
    expect(screen.getByRole("button", { name: /place order/i })).toBeDisabled();
  });
});

// ─── TS-001-020 ───────────────────────────────────────────────────────────────

describe("TS-001-020", () => {
  it("checkout form shows validation errors for empty required fields", async () => {
    const user = userEvent.setup();

    // Pre-seed session and go directly to step 1
    useCheckoutStore.getState().setSessionToken("session-token-abc", "2026-04-12T23:59:59Z");
    seedCartWithItems();

    renderCheckoutPage();

    await waitFor(() => {
      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    });

    // Attempt to proceed without filling required fields
    await user.click(screen.getByRole("button", { name: /continue to shipping/i }));

    // Validation errors appear for required fields
    await waitFor(() => {
      expect(screen.getByText(/address line 1 is required/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/city is required/i)).toBeInTheDocument();
    expect(screen.getByText(/postal code is required/i)).toBeInTheDocument();
    expect(screen.getByText(/country is required/i)).toBeInTheDocument();

    // Form does not advance — still on step 1: address field still visible, no radio buttons (step 2 content)
    expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    // Step 2 shipping method radio options are not rendered (only the stepper label exists, not the options)
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
