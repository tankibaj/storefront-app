import type { CartItem } from "../stores/cart-store";
import { formatPrice } from "../utils/format";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const subtotal = item.price_minor * item.quantity;

  return (
    <tr>
      <td style={{ padding: "0.5rem 0.75rem" }}>{item.product_name}</td>
      <td style={{ padding: "0.5rem 0.75rem" }}>{item.variant_label}</td>
      <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>{item.quantity}</td>
      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>
        {formatPrice(item.price_minor)}
      </td>
      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>{formatPrice(subtotal)}</td>
    </tr>
  );
}
