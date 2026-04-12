interface QuantityControlProps {
  quantity: number;
  onChangeAction: (newQuantity: number) => void;
  min?: number;
}

export function QuantityControl({ quantity, onChangeAction, min = 1 }: QuantityControlProps) {
  function handleDecrement() {
    const next = quantity - 1;
    if (next >= min) {
      onChangeAction(next);
    }
  }

  function handleIncrement() {
    onChangeAction(quantity + 1);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(parsed)) {
      onChangeAction(parsed < min ? min : parsed);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
      <button
        type="button"
        onClick={handleDecrement}
        aria-label="Decrease quantity"
        disabled={quantity <= min}
        style={{ padding: "0.25rem 0.5rem", cursor: quantity <= min ? "not-allowed" : "pointer" }}
      >
        −
      </button>
      <input
        type="number"
        value={quantity}
        min={min}
        onChange={handleInputChange}
        aria-label="Quantity"
        style={{ width: "3rem", textAlign: "center", padding: "0.25rem" }}
      />
      <button
        type="button"
        onClick={handleIncrement}
        aria-label="Increase quantity"
        style={{ padding: "0.25rem 0.5rem" }}
      >
        +
      </button>
    </div>
  );
}
