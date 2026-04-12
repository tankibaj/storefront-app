import { useCartStore } from "../stores/cart-store";
import { formatPrice } from "../utils/format";

export function CartTotal() {
  const totalPrice = useCartStore((state) => state.totalPrice());

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 0",
        borderTop: "2px solid #333",
        fontWeight: "bold",
        fontSize: "1.1rem",
      }}
    >
      <span>Cart Total:</span>
      <span data-testid="cart-total">{formatPrice(totalPrice)}</span>
    </div>
  );
}
