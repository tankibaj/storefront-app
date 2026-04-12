import { Link } from "react-router-dom";
import { CartItemRow } from "../components/CartItemRow";
import { CartTotal } from "../components/CartTotal";
import { useCartStore } from "../stores/cart-store";

export function CartPage() {
  const items = useCartStore((state) => state.items);

  if (items.length === 0) {
    return (
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/products">Browse products</Link>
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
            <th style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>Qty</th>
            <th style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>Unit Price</th>
            <th style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <CartItemRow key={item.sku_id} item={item} />
          ))}
        </tbody>
      </table>

      <CartTotal />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
        <Link
          to="/checkout"
          style={{
            padding: "0.75rem 2rem",
            background: "#2d7a2d",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Checkout
        </Link>
      </div>
    </main>
  );
}
