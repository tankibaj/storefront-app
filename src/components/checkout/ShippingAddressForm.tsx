import { useState } from "react";
import type { ShippingAddress } from "../../stores/checkout-store";
import { useCheckoutStore } from "../../stores/checkout-store";

const COUNTRY_OPTIONS = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
];

type ValidationErrors = Partial<Record<keyof ShippingAddress, string>>;

function validateAddress(address: ShippingAddress): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!address.line1.trim()) errors.line1 = "Address Line 1 is required";
  else if (address.line1.length > 100)
    errors.line1 = "Address Line 1 must be 100 characters or fewer";

  if (address.line2.length > 100) errors.line2 = "Address Line 2 must be 100 characters or fewer";

  if (!address.city.trim()) errors.city = "City is required";
  else if (address.city.length > 100) errors.city = "City must be 100 characters or fewer";

  if (address.state.length > 100) errors.state = "State / Province must be 100 characters or fewer";

  if (!address.postal_code.trim()) errors.postal_code = "Postal Code is required";
  else if (address.postal_code.length > 20)
    errors.postal_code = "Postal Code must be 20 characters or fewer";

  if (!address.country_code) errors.country_code = "Country is required";

  return errors;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "12px",
  marginTop: "4px",
};

const fieldStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "500",
  fontSize: "14px",
  marginBottom: "4px",
};

export function ShippingAddressForm() {
  const shippingAddress = useCheckoutStore((state) => state.shippingAddress);
  const setShippingAddress = useCheckoutStore((state) => state.setShippingAddress);
  const setCurrentStep = useCheckoutStore((state) => state.setCurrentStep);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ShippingAddress, boolean>>>({});

  const handleChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress({ [field]: value });
    if (touched[field]) {
      // Re-validate on change after first submit attempt
      const newErrors = validateAddress({ ...shippingAddress, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const handleContinue = () => {
    const allTouched: Partial<Record<keyof ShippingAddress, boolean>> = {
      line1: true,
      line2: true,
      city: true,
      state: true,
      postal_code: true,
      country_code: true,
    };
    setTouched(allTouched);

    const newErrors = validateAddress(shippingAddress);
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(2);
    }
  };

  const fieldError = (field: keyof ShippingAddress) => (touched[field] ? errors[field] : undefined);

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>Shipping Address</h2>

      <div style={fieldStyle}>
        <label htmlFor="line1" style={labelStyle}>
          Address Line 1 <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="line1"
          type="text"
          value={shippingAddress.line1}
          onChange={(e) => handleChange("line1", e.target.value)}
          style={{
            ...inputStyle,
            borderColor: fieldError("line1") ? "#dc2626" : "#d1d5db",
          }}
          aria-describedby={fieldError("line1") ? "line1-error" : undefined}
          aria-required="true"
        />
        {fieldError("line1") && (
          <p id="line1-error" role="alert" style={errorStyle}>
            {fieldError("line1")}
          </p>
        )}
      </div>

      <div style={fieldStyle}>
        <label htmlFor="line2" style={labelStyle}>
          Address Line 2
        </label>
        <input
          id="line2"
          type="text"
          value={shippingAddress.line2}
          onChange={(e) => handleChange("line2", e.target.value)}
          style={{
            ...inputStyle,
            borderColor: fieldError("line2") ? "#dc2626" : "#d1d5db",
          }}
        />
        {fieldError("line2") && (
          <p role="alert" style={errorStyle}>
            {fieldError("line2")}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={fieldStyle}>
          <label htmlFor="city" style={labelStyle}>
            City <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            id="city"
            type="text"
            value={shippingAddress.city}
            onChange={(e) => handleChange("city", e.target.value)}
            style={{
              ...inputStyle,
              borderColor: fieldError("city") ? "#dc2626" : "#d1d5db",
            }}
            aria-describedby={fieldError("city") ? "city-error" : undefined}
            aria-required="true"
          />
          {fieldError("city") && (
            <p id="city-error" role="alert" style={errorStyle}>
              {fieldError("city")}
            </p>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="state" style={labelStyle}>
            State / Province
          </label>
          <input
            id="state"
            type="text"
            value={shippingAddress.state}
            onChange={(e) => handleChange("state", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={fieldStyle}>
          <label htmlFor="postal_code" style={labelStyle}>
            Postal Code <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            id="postal_code"
            type="text"
            value={shippingAddress.postal_code}
            onChange={(e) => handleChange("postal_code", e.target.value)}
            style={{
              ...inputStyle,
              borderColor: fieldError("postal_code") ? "#dc2626" : "#d1d5db",
            }}
            aria-describedby={fieldError("postal_code") ? "postal-code-error" : undefined}
            aria-required="true"
          />
          {fieldError("postal_code") && (
            <p id="postal-code-error" role="alert" style={errorStyle}>
              {fieldError("postal_code")}
            </p>
          )}
        </div>

        <div style={fieldStyle}>
          <label htmlFor="country_code" style={labelStyle}>
            Country <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <select
            id="country_code"
            value={shippingAddress.country_code}
            onChange={(e) => handleChange("country_code", e.target.value)}
            style={{
              ...inputStyle,
              borderColor: fieldError("country_code") ? "#dc2626" : "#d1d5db",
            }}
            aria-describedby={fieldError("country_code") ? "country-error" : undefined}
            aria-required="true"
          >
            <option value="">Select a country</option>
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {fieldError("country_code") && (
            <p id="country-error" role="alert" style={errorStyle}>
              {fieldError("country_code")}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={handleContinue}
          style={{
            padding: "0.75rem 2rem",
            background: "#1a56db",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Continue to Shipping
        </button>
      </div>
    </div>
  );
}
