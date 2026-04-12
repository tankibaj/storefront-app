interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <p>{message}</p>
    </div>
  );
}
