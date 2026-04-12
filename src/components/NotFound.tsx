import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Product not found</h2>
      <p>The product you are looking for does not exist.</p>
      <Link to="/products">Back to catalogue</Link>
    </div>
  );
}
