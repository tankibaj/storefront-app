import { Link, Navigate, useLocation } from "react-router-dom";
import { OrderSummary } from "../components/checkout/OrderSummary";
import type { GuestOrder } from "../types/api";

interface ConfirmationLocationState {
  order?: GuestOrder;
}

export function OrderConfirmationPage() {
  const location = useLocation();
  const state = (location.state ?? {}) as ConfirmationLocationState;
  const order = state.order;

  // Guard: direct navigation without order data → redirect to /products
  if (!order) {
    return <Navigate to="/products" replace />;
  }

  return (
    <main style={{ maxWidth: "640px", margin: "0 auto", padding: "2rem 1rem" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "2rem",
          padding: "1.5rem",
          background: "#f0fdf4",
          borderRadius: "8px",
          border: "1px solid #bbf7d0",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✓</div>
        <h1 style={{ marginBottom: "0.5rem", color: "#166534" }}>Order Confirmed!</h1>
        <p style={{ color: "#166534", margin: 0 }}>
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ margin: "0 0 0.25rem", fontSize: "13px", color: "#6b7280" }}>Order Reference</p>
        <p
          data-testid="order-reference"
          style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold", letterSpacing: "0.05em" }}
        >
          {order.reference}
        </p>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem" }}>Order Summary</h2>
        <OrderSummary order={order} />
      </div>

      <div style={{ textAlign: "center" }}>
        <Link
          to="/products"
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            background: "#1a56db",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}
