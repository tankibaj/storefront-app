import { Link } from "react-router-dom";
import { useCartStore } from "../stores/cart-store";

export function CartIcon() {
  const totalItems = useCartStore((state) => state.totalItems());

  return (
    <Link
      to="/cart"
      aria-label={`Cart (${totalItems} items)`}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
    >
      <span role="img" aria-hidden="true" style={{ fontSize: "1.5rem" }}>
        🛒
      </span>
      {totalItems > 0 && (
        <span
          data-testid="cart-count"
          style={{
            position: "absolute",
            top: "-8px",
            right: "-10px",
            background: "#e53e3e",
            color: "#fff",
            borderRadius: "50%",
            fontSize: "0.75rem",
            fontWeight: "bold",
            minWidth: "18px",
            height: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
          }}
        >
          {totalItems}
        </span>
      )}
    </Link>
  );
}
