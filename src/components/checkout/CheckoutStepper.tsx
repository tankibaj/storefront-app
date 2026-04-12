interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { number: 1, label: "Shipping Address" },
  { number: 2, label: "Shipping Method" },
  { number: 3, label: "Payment" },
];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <nav aria-label="Checkout steps" style={{ display: "flex", gap: "0", marginBottom: "2rem" }}>
      {STEPS.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;

        return (
          <div
            key={step.number}
            style={{
              display: "flex",
              alignItems: "center",
              flex: index < STEPS.length - 1 ? 1 : undefined,
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
            >
              <div
                aria-current={isActive ? "step" : undefined}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "14px",
                  background: isCompleted ? "#2d7a2d" : isActive ? "#1a56db" : "#e5e7eb",
                  color: isCompleted || isActive ? "#fff" : "#6b7280",
                  border: "none",
                }}
              >
                {isCompleted ? "✓" : step.number}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: isActive ? "600" : "400",
                  color: isActive ? "#1a56db" : "#6b7280",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: "2px",
                  background: isCompleted ? "#2d7a2d" : "#e5e7eb",
                  margin: "0 8px",
                  marginBottom: "20px",
                }}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
