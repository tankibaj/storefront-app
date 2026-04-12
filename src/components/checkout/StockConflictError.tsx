import { useNavigate } from "react-router-dom";

export interface ResolvedConflict {
  sku_id: string;
  requested: number;
  available: number;
  product_name: string;
  variant_label: string;
}

interface StockConflictErrorProps {
  conflicts: ResolvedConflict[];
}

export function StockConflictError({ conflicts }: StockConflictErrorProps) {
  const navigate = useNavigate();

  return (
    <div
      role="alert"
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "6px",
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
      }}
    >
      <p style={{ margin: "0 0 0.75rem", fontWeight: "600", color: "#991b1b" }}>
        Some items are no longer available in the requested quantity
      </p>
      <ul style={{ margin: "0 0 1rem", paddingLeft: "1.25rem" }}>
        {conflicts.map((conflict) => (
          <li key={conflict.sku_id} style={{ color: "#7f1d1d", marginBottom: "0.25rem" }}>
            Only {conflict.available} unit{conflict.available !== 1 ? "s" : ""} of{" "}
            {conflict.product_name} ({conflict.variant_label}) available (you requested{" "}
            {conflict.requested})
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => navigate("/cart")}
        style={{
          padding: "0.5rem 1.25rem",
          background: "#991b1b",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        Return to Cart
      </button>
    </div>
  );
}
