import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckoutStepper } from "../components/checkout/CheckoutStepper";
import { PaymentForm } from "../components/checkout/PaymentForm";
import { SessionExpiredError } from "../components/checkout/SessionExpiredError";
import { ShippingAddressForm } from "../components/checkout/ShippingAddressForm";
import { ShippingMethodSelector } from "../components/checkout/ShippingMethodSelector";
import {
  type ResolvedConflict,
  StockConflictError,
} from "../components/checkout/StockConflictError";
import { usePlaceOrder } from "../hooks/usePlaceOrder";
import { StripeProvider } from "../providers/StripeProvider";
import { useCartStore } from "../stores/cart-store";
import { useCheckoutStore } from "../stores/checkout-store";
import type { PlaceGuestOrderRequest, ValidationErrorDetail } from "../types/api";

// ─── Field → step mapping ─────────────────────────────────────────────────────

function getEarliestErroredStep(errors: ValidationErrorDetail[]): 1 | 2 | 3 {
  const fields = errors.map((e) => e.field);
  if (fields.some((f) => f.startsWith("shipping_address."))) return 1;
  if (fields.some((f) => f === "shipping_method_id")) return 2;
  return 3;
}

// ─── CheckoutPage ─────────────────────────────────────────────────────────────

export function CheckoutPage() {
  const navigate = useNavigate();

  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const currentStep = useCheckoutStore((state) => state.currentStep);
  const setCurrentStep = useCheckoutStore((state) => state.setCurrentStep);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);

  const [serverErrors, setServerErrors] = useState<ValidationErrorDetail[]>([]);
  const [stockConflicts, setStockConflicts] = useState<ResolvedConflict[] | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const { mutate: submitOrder, isPending } = usePlaceOrder();

  // Route guard: empty cart → redirect to /cart
  if (cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handlePlaceOrder = (paymentMethodId: string) => {
    // Clear any previous errors on retry
    setServerErrors([]);
    setStockConflicts(null);
    setPaymentError(null);
    setSessionExpired(false);

    const { email, shippingAddress, selectedShippingMethodId, sessionToken } =
      useCheckoutStore.getState();

    const request: PlaceGuestOrderRequest = {
      email,
      shipping_address: {
        line1: shippingAddress.line1,
        ...(shippingAddress.line2.trim() ? { line2: shippingAddress.line2 } : {}),
        city: shippingAddress.city,
        ...(shippingAddress.state.trim() ? { state: shippingAddress.state } : {}),
        postal_code: shippingAddress.postal_code,
        country_code: shippingAddress.country_code,
      },
      shipping_method_id: selectedShippingMethodId ?? "",
      payment_method: { type: "card", token: paymentMethodId },
      lines: cartItems.map((item) => ({ sku_id: item.sku_id, quantity: item.quantity })),
    };

    submitOrder(
      { request, sessionToken: sessionToken ?? "" },
      {
        onSuccess: (order) => {
          clearCart();
          resetCheckout();
          navigate("/checkout/confirmation", { state: { order } });
        },
        onError: (err) => {
          if (err.type === "validation") {
            setServerErrors(err.details);
            const step = getEarliestErroredStep(err.details);
            setCurrentStep(step);
            return;
          }

          if (err.type === "stock_conflict") {
            // Resolve product names from cart items
            const resolved: ResolvedConflict[] = err.conflicts.map((conflict) => {
              const cartItem = cartItems.find((i) => i.sku_id === conflict.sku_id);
              return {
                sku_id: conflict.sku_id,
                requested: conflict.requested,
                available: conflict.available,
                product_name: cartItem?.product_name ?? conflict.sku_id,
                variant_label: cartItem?.variant_label ?? "",
              };
            });
            setStockConflicts(resolved);
            return;
          }

          if (err.type === "session_expired") {
            resetCheckout();
            setSessionExpired(true);
            return;
          }

          // payment_failed or other
          setPaymentError(err.message);
        },
      }
    );
  };

  // Session expired: show message, then redirect to /cart via component's useEffect
  if (sessionExpired) {
    return (
      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem 1rem" }}>
        <SessionExpiredError />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Checkout</h1>

      <CheckoutStepper currentStep={currentStep} />

      {stockConflicts && <StockConflictError conflicts={stockConflicts} />}

      {currentStep === 1 && <ShippingAddressForm serverErrors={serverErrors} />}
      {currentStep === 2 && <ShippingMethodSelector />}
      {currentStep === 3 && (
        <StripeProvider>
          <PaymentForm
            onPlaceOrder={handlePlaceOrder}
            isSubmitting={isPending}
            serverErrors={serverErrors}
            paymentError={paymentError}
          />
        </StripeProvider>
      )}
    </main>
  );
}
