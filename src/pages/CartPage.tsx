import { useNavigate } from "react-router-dom";
import { CartItemRow } from "../components/CartItemRow";
import { CartTotal } from "../components/CartTotal";
import { EmptyCart } from "../components/EmptyCart";
import { useCreateGuestSession } from "../hooks/useCreateGuestSession";
import { useCartStore } from "../stores/cart-store";

export function CartPage() {
  const items = useCartStore((state) => state.items);
  const navigate = useNavigate();
  const createSession = useCreateGuestSession();

  if (items.length === 0) {
    return (
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <h1>Your cart</h1>
        <EmptyCart />
      </main>
    );
  }

  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "1rem" }}>
      <h1>Your cart</h1>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc", textAlign: "left" }}>
            <th style={{ padding: "0.5rem 0.75rem" }}>Product</th>
            <th style={{ padding: "0.5rem 0.75rem" }}>Variant</th>
            <th style={{ padding: "0.5rem 0.75rem" }}>Qty</th>
            <th style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>Unit Price</th>
            <th style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>Subtotal</th>
            <th style={{ padding: "0.5rem 0.75rem" }} />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <CartItemRow key={item.sku_id} item={item} />
          ))}
        </tbody>
      </table>

      <CartTotal />

      {createSession.isError && (
        <p role="alert" style={{ color: "#dc2626", textAlign: "right", marginTop: "0.5rem" }}>
          Unable to start checkout. Please try again.
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
        <button
          type="button"
          disabled={createSession.isPending}
          onClick={() => {
            createSession.mutate(undefined, {
              onSuccess: () => navigate("/checkout"),
            });
          }}
          style={{
            padding: "0.75rem 2rem",
            background: createSession.isPending ? "#9ca3af" : "#2d7a2d",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: createSession.isPending ? "not-allowed" : "pointer",
          }}
        >
          {createSession.isPending ? "Starting checkout…" : "Checkout"}
        </button>
      </div>
    </main>
  );
}
