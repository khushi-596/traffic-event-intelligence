import Modal from "./Modal";

function HeatmapDetailsModal({ isOpen, onClose, cell }) {
  if (!cell) return null;

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return { backgroundColor: "#fee2e2", color: "var(--severity-risk)", borderColor: "#fca5a5" };
      case "high":
        return { backgroundColor: "#ffedd5", color: "var(--severity-warning)", borderColor: "#fed7aa" };
      case "medium":
        return { backgroundColor: "#fef3c7", color: "#d97706", borderColor: "#fcd34d" };
      case "low":
      default:
        return { backgroundColor: "#d1fae5", color: "var(--severity-safe)", borderColor: "#6ee7b7" };
    }
  };

  const badgeStyles = getRiskColor(cell.risk_level || "low");

  // Mock static values representing historical intelligence (pure and idempotent)
  const corridorHash = cell.corridor ? cell.corridor.length : 10;
  const mockHistoricalCount = cell.historical_events || ((corridorHash * 7) % 45) + 12;
  const mockAvgDuration = cell.average_duration || `${((corridorHash * 13) % 60) + 30} Minutes`;
  const mockPeakRiskPeriod = cell.peak_risk_period || "08:30 AM - 10:30 AM";

  const formatDateLabel = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Corridor Risk Intelligence Overview">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>HISTORICAL DISPATCH INTEL</span>
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: "4px",
            border: "1px solid",
            ...badgeStyles
          }}>
            {cell.risk_level || "low"} Risk
          </span>
        </div>

        {/* Corridor details */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          backgroundColor: "#f8fafc",
          padding: "16px",
          borderRadius: "4px",
          border: "1px solid var(--border-color)"
        }}>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Corridor Name</span>
            <strong style={{ fontSize: "16px", color: "var(--text-primary)" }}>{cell.corridor}</strong>
          </div>
          <div style={{ marginTop: "6px" }}>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Forecast Date</span>
            <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{formatDateLabel(cell.date)}</span>
          </div>
        </div>

        {/* Detailed Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Historical Incident Count</span>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{mockHistoricalCount} Cases</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Average Incident Duration</span>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{mockAvgDuration}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Peak Congestion Period</span>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{mockPeakRiskPeriod}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Predicted Event</span>
            <strong style={{ fontSize: "13px", color: "var(--severity-risk)" }}>{cell.predicted_event_type || "No events forecasted"}</strong>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={onClose} 
          style={{
            background: "var(--bg-nav)",
            color: "white",
            border: "none",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "8px",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#1e293b"}
          onMouseOut={(e) => e.currentTarget.style.background = "var(--bg-nav)"}
        >
          Confirm Intelligence Audit
        </button>
      </div>
    </Modal>
  );
}

export default HeatmapDetailsModal;
