import { useNavigate } from "react-router-dom";

export function SessionExpiredError() {
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
        Your session has expired.
      </p>
      <button
        type="button"
        onClick={() => navigate("/cart", { replace: true })}
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
