import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../../api/client";
import { NotFound } from "../../../components/NotFound";
import { useProduct } from "../hooks/useProduct";
import { VariantList } from "./VariantList";

const placeholderStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "400px",
  paddingTop: "66%",
  backgroundColor: "#e0e0e0",
  position: "relative",
  display: "block",
};

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading, isError, error, refetch } = useProduct(productId ?? "");

  if (isLoading) {
    return <p>Loading product…</p>;
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <NotFound />;
    }
    return (
      <div style={{ padding: "2rem" }}>
        <p>Unable to load product. Please try again.</p>
        <button type="button" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <main style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
      <Link to="/products">← Back to catalogue</Link>

      <h1 style={{ marginTop: "1rem" }}>{product.name}</h1>

      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width: "100%", maxWidth: "400px", display: "block", marginBottom: "1rem" }}
        />
      ) : (
        <div style={placeholderStyle} aria-label="Product image placeholder" />
      )}

      {product.description && <p style={{ marginBottom: "1.5rem" }}>{product.description}</p>}

      <h2>Variants</h2>
      <VariantList skus={product.skus} productName={product.name} imageUrl={product.image_url} />
    </main>
  );
}
