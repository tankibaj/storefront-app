import type { SKU } from "../../../types/api";
import { formatPrice } from "../../../utils/format";

interface VariantListProps {
  skus: SKU[];
}

export function VariantList({ skus }: VariantListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {skus.map((sku) => {
        const inStock = sku.stock_level > 0;
        return (
          <li
            key={sku.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.5rem 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span style={{ flex: 1 }}>{sku.label}</span>
            <span>{formatPrice(sku.price_minor)}</span>
            <span
              style={{ color: inStock ? "#2d7a2d" : "#999", minWidth: "80px", textAlign: "right" }}
            >
              {inStock ? "In stock" : "Out of stock"}
            </span>
            <button
              type="button"
              disabled={!inStock}
              style={{ opacity: inStock ? 1 : 0.5, cursor: inStock ? "pointer" : "not-allowed" }}
            >
              Add to Cart
            </button>
          </li>
        );
      })}
    </ul>
  );
}
