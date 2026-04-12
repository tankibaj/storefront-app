import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckoutStepper } from "../components/checkout/CheckoutStepper";
import { PaymentForm } from "../components/checkout/PaymentForm";
import { ShippingAddressForm } from "../components/checkout/ShippingAddressForm";
import { ShippingMethodSelector } from "../components/checkout/ShippingMethodSelector";
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

  const { mutate: submitOrder, isPending } = usePlaceOrder();

  // Route guard: empty cart → redirect to /cart
  if (cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handlePlaceOrder = (paymentMethodId: string) => {
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
          }
          // Other errors (409, 401) handled by WP-006-FE
        },
      }
    );
  };

  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Checkout</h1>

      <CheckoutStepper currentStep={currentStep} />

      {currentStep === 1 && <ShippingAddressForm serverErrors={serverErrors} />}
      {currentStep === 2 && <ShippingMethodSelector />}
      {currentStep === 3 && (
        <StripeProvider>
          <PaymentForm
            onPlaceOrder={handlePlaceOrder}
            isSubmitting={isPending}
            serverErrors={serverErrors}
          />
        </StripeProvider>
      )}
    </main>
  );
}
