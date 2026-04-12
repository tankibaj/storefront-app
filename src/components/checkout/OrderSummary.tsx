import type { GuestOrder } from "../../types/api";
import { formatPrice } from "../../utils/format";

interface OrderSummaryProps {
  order: GuestOrder;
}

export function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "1rem",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{ textAlign: "left", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb" }}
            >
              Item
            </th>
            <th
              style={{
                textAlign: "center",
                padding: "0.5rem 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              Qty
            </th>
            <th
              style={{ textAlign: "right", padding: "0.5rem 0", borderBottom: "1px solid #e5e7eb" }}
            >
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.sku_id}>
              <td style={{ padding: "0.5rem 0" }}>
                <span>{line.product_name}</span>
                {line.variant_label && (
                  <span style={{ color: "#6b7280", marginLeft: "0.25rem" }}>
                    / {line.variant_label}
                  </span>
                )}
              </td>
              <td style={{ textAlign: "center", padding: "0.5rem 0" }}>{line.quantity}</td>
              <td style={{ textAlign: "right", padding: "0.5rem 0" }}>
                {formatPrice(line.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: "bold",
          fontSize: "16px",
          paddingTop: "0.75rem",
          borderTop: "2px solid #e5e7eb",
        }}
      >
        <span>Total</span>
        <span data-testid="order-total">{formatPrice(order.total)}</span>
      </div>
    </div>
  );
}
