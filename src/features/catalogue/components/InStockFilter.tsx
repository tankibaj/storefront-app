interface InStockFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function InStockFilter({ checked, onChange }: InStockFilterProps) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label="In stock only"
      />
      In stock only
    </label>
  );
}
