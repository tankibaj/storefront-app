import { useState } from "react";
import { useCartStore } from "../../../stores/cart-store";
import type { SKU } from "../../../types/api";
import { formatPrice } from "../../../utils/format";

interface VariantListProps {
  skus: SKU[];
  productName: string;
  imageUrl: string | null;
}

export function VariantList({ skus, productName, imageUrl }: VariantListProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [addedSkuId, setAddedSkuId] = useState<string | null>(null);

  function handleAddToCart(sku: SKU) {
    addItem({
      sku_id: sku.id,
      product_name: productName,
      variant_label: sku.label,
      price_minor: sku.price_minor,
      image_url: imageUrl,
    });

    setAddedSkuId(sku.id);
    setTimeout(() => setAddedSkuId(null), 1000);
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {skus.map((sku) => {
        const inStock = sku.stock_level > 0;
        const justAdded = addedSkuId === sku.id;

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
              onClick={() => handleAddToCart(sku)}
              style={{ opacity: inStock ? 1 : 0.5, cursor: inStock ? "pointer" : "not-allowed" }}
            >
              {justAdded ? "Added!" : "Add to Cart"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
