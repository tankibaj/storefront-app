import { Link } from "react-router-dom";

export function EmptyCart() {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
      <p style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Your cart is empty.</p>
      <Link to="/products">Browse products</Link>
    </div>
  );
}
