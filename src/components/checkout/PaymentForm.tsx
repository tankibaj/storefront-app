import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useCheckoutStore } from "../../stores/checkout-store";
import type { ValidationErrorDetail } from "../../types/api";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "12px",
  marginTop: "4px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "500",
  fontSize: "14px",
  marginBottom: "4px",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface PaymentFormProps {
  onPlaceOrder: (paymentMethodId: string) => void;
  isSubmitting?: boolean;
  serverErrors?: ValidationErrorDetail[];
}

export function PaymentForm({
  onPlaceOrder,
  isSubmitting = false,
  serverErrors = [],
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const email = useCheckoutStore((state) => state.email);
  const setEmail = useCheckoutStore((state) => state.setEmail);
  const selectedShippingMethodId = useCheckoutStore((state) => state.selectedShippingMethodId);
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  const setCurrentStep = useCheckoutStore((state) => state.setCurrentStep);

  const [cardComplete, setCardComplete] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const addressValid =
    !!shippingAddress.line1.trim() &&
    !!shippingAddress.city.trim() &&
    !!shippingAddress.postal_code.trim() &&
    !!shippingAddress.country_code;

  const emailValid = isValidEmail(email);
  const allComplete = addressValid && !!selectedShippingMethodId && cardComplete && emailValid;

  const handlePlaceOrder = async () => {
    if (!allComplete || !stripe || !elements || isSubmitting) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      setStripeError(error.message ?? "Payment error");
      return;
    }

    if (paymentMethod?.id) {
      onPlaceOrder(paymentMethod.id);
    }
  };

  // Server-side error for email field
  const serverEmailError = serverErrors.find((e) => e.field === "email")?.issue;

  const emailError =
    serverEmailError ??
    (emailTouched && !emailValid ? "A valid email address is required" : undefined);

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Payment Details</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="email" style={labelStyle}>
          Email Address <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          style={{
            ...inputStyle,
            borderColor: emailError ? "#dc2626" : "#d1d5db",
          }}
          aria-required="true"
          aria-describedby={emailError ? "email-error" : undefined}
          placeholder="you@example.com"
        />
        {emailError && (
          <p id="email-error" role="alert" style={errorStyle}>
            {emailError}
          </p>
        )}
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ ...labelStyle, margin: 0, marginBottom: "4px" }}>Card Details</p>
        <div
          style={{
            padding: "0.625rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            background: "#fff",
          }}
        >
          <CardElement
            options={{ style: { base: { fontSize: "14px" } } }}
            onChange={(e) => {
              setCardComplete(e.complete);
              if (e.error) setStripeError(e.error.message);
              else setStripeError(null);
            }}
          />
        </div>
        {stripeError && (
          <p role="alert" style={errorStyle}>
            {stripeError}
          </p>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            color: "#1a56db",
            border: "1px solid #1a56db",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={!allComplete || isSubmitting}
          style={{
            padding: "0.75rem 2rem",
            background: allComplete && !isSubmitting ? "#2d7a2d" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: allComplete && !isSubmitting ? "pointer" : "not-allowed",
            fontSize: "14px",
          }}
        >
          {isSubmitting ? "Placing Order…" : "Place Order"}
        </button>
      </div>
    </div>
  );
}
