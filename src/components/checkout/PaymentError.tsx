interface PaymentErrorProps {
  message: string;
}

export function PaymentError({ message }: PaymentErrorProps) {
  return (
    <div
      role="alert"
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "6px",
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
        color: "#991b1b",
        fontSize: "14px",
      }}
    >
      {message}
    </div>
  );
}
