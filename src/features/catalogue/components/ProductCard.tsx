import { Link } from "react-router-dom";
import type { Product } from "../../../types/api";
import { formatPrice } from "../../../utils/format";

interface ProductCardProps {
  product: Product;
}

const placeholderStyle: React.CSSProperties = {
  width: "100%",
  paddingTop: "66%",
  backgroundColor: "#e0e0e0",
  position: "relative",
};

export function ProductCard({ product }: ProductCardProps) {
  const firstSku = product.skus[0];
  const price = firstSku ? formatPrice(firstSku.price_minor) : "—";

  return (
    <Link
      to={`/products/${product.id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: "100%", display: "block" }}
          />
        ) : (
          <div style={placeholderStyle} aria-label="Product image placeholder" />
        )}
        <div style={{ padding: "0.75rem" }}>
          <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>{product.name}</p>
          <p style={{ margin: 0, color: "#555" }}>{price}</p>
        </div>
      </div>
    </Link>
  );
}
