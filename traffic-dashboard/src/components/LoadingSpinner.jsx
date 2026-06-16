function LoadingSpinner({ message = "Processing requests..." }) {
  return (
    <div className="flex-center-spinner" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "30px",
      gap: "12px",
      color: "var(--text-secondary)"
    }}>
      <div className="spinner" style={{
        width: "36px",
        height: "36px",
        border: "3px solid #e2e8f0",
        borderLeftColor: "var(--accent-primary)",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }}></div>
      <span style={{ fontSize: "14px", fontWeight: 500 }}>{message}</span>
    </div>
  );
}

export default LoadingSpinner;
