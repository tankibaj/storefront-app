import { useCheckoutStore } from "../../stores/checkout-store";
import { formatPrice } from "../../utils/format";
import { useShippingMethods } from "../../hooks/useShippingMethods";

export function ShippingMethodSelector() {
  const selectedShippingMethodId = useCheckoutStore((state) => state.selectedShippingMethodId);
  const setShippingMethodId = useCheckoutStore((state) => state.setShippingMethodId);
  const setCurrentStep = useCheckoutStore((state) => state.setCurrentStep);

  const { data: methods, isLoading, isError, refetch } = useShippingMethods();

  if (isLoading) {
    return <p>Loading shipping options…</p>;
  }

  if (isError) {
    return (
      <div>
        <p>Unable to load shipping options. Please try again.</p>
        <button
          type="button"
          onClick={() => refetch()}
          style={{
            padding: "0.5rem 1rem",
            background: "#1a56db",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const handleContinue = () => {
    if (selectedShippingMethodId) {
      setCurrentStep(3);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Shipping Method</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {(methods ?? []).map((method) => {
          const isSelected = selectedShippingMethodId === method.id;
          return (
            <label
              key={method.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
                padding: "1rem",
                border: `2px solid ${isSelected ? "#1a56db" : "#d1d5db"}`,
                borderRadius: "6px",
                cursor: "pointer",
                background: isSelected ? "#eff6ff" : "#fff",
              }}
            >
              <input
                type="radio"
                name="shipping-method"
                value={method.id}
                checked={isSelected}
                onChange={() => setShippingMethodId(method.id)}
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "600" }}>{method.name}</span>
                  <span style={{ fontWeight: "600" }}>{formatPrice(method.cost_minor)}</span>
                </div>
                <div style={{ color: "#6b7280", fontSize: "13px", marginTop: "2px" }}>
                  {method.description}
                </div>
                <div style={{ color: "#6b7280", fontSize: "13px" }}>
                  {method.estimated_days_min}–{method.estimated_days_max} business days
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          style={{
            padding: "0.75rem 1.5rem",
            background: "transparent",
            color: "#1a56db",
            border: "1px solid #1a56db",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedShippingMethodId}
          style={{
            padding: "0.75rem 2rem",
            background: selectedShippingMethodId ? "#1a56db" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: selectedShippingMethodId ? "pointer" : "not-allowed",
            fontSize: "14px",
          }}
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
