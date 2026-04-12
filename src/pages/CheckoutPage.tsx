import { Navigate } from "react-router-dom";
import { CheckoutStepper } from "../components/checkout/CheckoutStepper";
import { PaymentForm } from "../components/checkout/PaymentForm";
import { ShippingAddressForm } from "../components/checkout/ShippingAddressForm";
import { ShippingMethodSelector } from "../components/checkout/ShippingMethodSelector";
import { StripeProvider } from "../providers/StripeProvider";
import { useCartStore } from "../stores/cart-store";
import { useCheckoutStore } from "../stores/checkout-store";

export function CheckoutPage() {
  const cartItems = useCartStore((state) => state.items);
  const currentStep = useCheckoutStore((state) => state.currentStep);

  // Route guard: empty cart → redirect to /cart
  if (cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const handlePlaceOrder = () => {
    // Order submission is handled by WP-005-FE
    // Placeholder: navigation/submission logic lives in the next WP
  };

  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Checkout</h1>

      <CheckoutStepper currentStep={currentStep} />

      {currentStep === 1 && <ShippingAddressForm />}
      {currentStep === 2 && <ShippingMethodSelector />}
      {currentStep === 3 && (
        <StripeProvider>
          <PaymentForm onPlaceOrder={handlePlaceOrder} />
        </StripeProvider>
      )}
    </main>
  );
}
