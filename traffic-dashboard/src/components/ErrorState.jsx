import { FaExclamationTriangle } from "react-icons/fa";

function ErrorState({ 
  message = "An error occurred while loading dashboard data.", 
  onRetry, 
  retryLabel = "Retry Request" 
}) {
  return (
    <div className="error-state-card" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "40px 20px",
      gap: "16px",
      border: "1px solid #fee2e2",
      backgroundColor: "#fef2f2",
      borderRadius: "6px",
      color: "var(--severity-risk)"
    }}>
      <FaExclamationTriangle style={{ fontSize: "32px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h4 style={{ fontWeight: 700, fontSize: "16px", margin: 0 }}>System Alert</h4>
        <p style={{ fontSize: "14px", color: "#7f1d1d", margin: 0 }}>{message}</p>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry} 
          style={{
            background: "var(--severity-risk)",
            color: "white",
            border: "none",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#b91c1c"}
          onMouseOut={(e) => e.currentTarget.style.background = "var(--severity-risk)"}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorState;
