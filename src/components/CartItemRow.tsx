import { type CartItem, useCartStore } from "../stores/cart-store";
import { formatPrice } from "../utils/format";
import { QuantityControl } from "./QuantityControl";

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const subtotal = item.price_minor * item.quantity;

  return (
    <tr>
      <td style={{ padding: "0.5rem 0.75rem" }}>{item.product_name}</td>
      <td style={{ padding: "0.5rem 0.75rem" }}>{item.variant_label}</td>
      <td style={{ padding: "0.5rem 0.75rem" }}>
        <QuantityControl
          quantity={item.quantity}
          onChangeAction={(qty) => updateQuantity(item.sku_id, qty)}
        />
      </td>
      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>
        {formatPrice(item.price_minor)}
      </td>
      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>{formatPrice(subtotal)}</td>
      <td style={{ padding: "0.5rem 0.75rem" }}>
        <button
          type="button"
          onClick={() => removeItem(item.sku_id)}
          aria-label={`Remove ${item.product_name} ${item.variant_label} from cart`}
          style={{
            color: "#c53030",
            background: "none",
            border: "1px solid #c53030",
            borderRadius: "4px",
            padding: "0.25rem 0.5rem",
            cursor: "pointer",
          }}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}
