import { FaFire } from "react-icons/fa";

function RiskHeatmap({ onCellClick, riskCalendar = null, loading = false, error = null }) {
  // Check if riskCalendar has heatmap_data (from backend API) or is array (mock)
  const isBackendApi = riskCalendar && riskCalendar.heatmap_data;
  const listData = isBackendApi ? riskCalendar.heatmap_data : (Array.isArray(riskCalendar) ? riskCalendar : []);

  // Columns can be hours (from backend) or dates (from mock)
  const isHourly = isBackendApi && riskCalendar.hours;
  const columns = isHourly 
    ? riskCalendar.hours.sort((a, b) => a - b)
    : [...new Set(listData.map((item) => item.date))].sort();

  const corridors = isBackendApi && riskCalendar.corridors
    ? riskCalendar.corridors.sort()
    : [...new Set(listData.map((item) => item.corridor))].sort();

  const getCellData = (corridor, colValue) => {
    if (isHourly) {
      const cell = listData.find((item) => item.corridor === corridor && item.hour_of_day === colValue);
      if (!cell) return null;

      // Find top predicted cause from cause_breakdown
      const breakdowns = riskCalendar.cause_breakdown?.filter(
        (b) => b.corridor === corridor && b.hour_of_day === colValue
      ) || [];
      let topCause = "None";
      if (breakdowns.length > 0) {
        const sorted = [...breakdowns].sort((a, b) => b.event_count - a.event_count);
        topCause = sorted[0].event_cause;
      }

      // Map event_count to risk level
      let risk_level;
      if (cell.event_count > 10) risk_level = "critical";
      else if (cell.event_count > 5) risk_level = "high";
      else if (cell.event_count > 2) risk_level = "medium";
      else if (cell.event_count > 0) risk_level = "low";
      else risk_level = "none";

      const causeDisplay = topCause && topCause !== "None"
        ? topCause.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "No Events";

      return {
        ...cell,
        risk_level,
        predicted_event_type: causeDisplay,
        historical_events: cell.event_count,
        average_duration: `${Math.round(cell.avg_duration_minutes)} Minutes`,
        peak_risk_period: `${String(colValue).padStart(2, '0')}:00 - ${String((colValue + 1) % 24).padStart(2, '0')}:00`,
        date: `Hour ${colValue}:00`
      };
    } else {
      // Date-based structure fallback
      return listData.find((item) => item.corridor === corridor && item.date === colValue);
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "#DC2626"; // Red
      case "high":
        return "#EA580C"; // Orange
      case "medium":
        return "#EAB308"; // Yellow
      case "low":
        return "#10B981"; // Green
      default:
        return "#f1f5f9"; // Light gray fallback for grid cells
    }
  };

  const formatColumnLabel = (col) => {
    if (isHourly) {
      return `${String(col).padStart(2, '0')}:00`;
    }
    try {
      const date = new Date(col);
      if (isNaN(date.getTime())) return col;
      return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    } catch {
      return col;
    }
  };

  return (
    <div className="heatmap-card glass-panel heatmap-container" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
      <div className="heatmap-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
        <div className="heatmap-title-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaFire className="heatmap-icon" style={{ color: "var(--severity-risk)" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
            {isHourly ? "Corridor Operational Risk Heatmap" : "7-Day Corridor Risk Heatmap"}
          </h2>
        </div>
        
        {/* Legend */}
        <div className="heatmap-legend" style={{ display: "flex", gap: "12px", padding: "4px 10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
          {[
            { label: "Low", color: getRiskColor("low") },
            { label: "Medium", color: getRiskColor("medium") },
            { label: "High", color: getRiskColor("high") },
            { label: "Critical", color: getRiskColor("critical") }
          ].map((item, idx) => (
            <div key={idx} className="legend-item" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600 }}>
              <span className="legend-dot" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color }}></span>
              <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="heatmap-loader" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "30px", gap: "10px", color: "var(--text-secondary)" }}>
          <div className="spinner" style={{ width: "24px", height: "24px" }}></div>
          <span style={{ fontSize: "13px" }}>Analyzing risk calendar forecasts...</span>
        </div>
      )}

      {error && <div className="heatmap-error" style={{ color: "var(--severity-risk)", fontSize: "13px", padding: "10px" }}>{error}</div>}

      {!loading && !error && listData.length > 0 && (
        <div className="heatmap-content-wrapper">
          <div className="heatmap-grid-scroll heatmap-scroll-container" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
            <table className="heatmap-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th className="corridor-header-cell" style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#f8fafc", padding: "10px 14px", color: "var(--text-secondary)", fontWeight: 700, textAlign: "left", fontSize: "11px", borderBottom: "1px solid var(--border-color)" }}>CORRIDOR</th>
                  {columns.map((col) => (
                    <th key={col} className="date-header-cell" style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#f8fafc", padding: "10px 14px", color: "var(--text-secondary)", fontWeight: 700, textAlign: "center", fontSize: "11px", borderBottom: "1px solid var(--border-color)" }}>
                      {formatColumnLabel(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corridors.map((corridor) => (
                  <tr key={corridor} style={{ borderTop: "1px solid var(--border-color)" }}>
                    <td className="corridor-name-cell" style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{corridor}</td>
                    {columns.map((col) => {
                      const cell = getCellData(corridor, col);
                      const color = getRiskColor(cell?.risk_level);
                      
                      return (
                        <td key={col} className="heatmap-cell-wrapper" style={{ padding: "6px", textAlign: "center" }}>
                          <button
                            id={`cell-${corridor.replace(/\s+/g, "-").toLowerCase()}-${col}`}
                            className="heatmap-cell-btn"
                            style={{ 
                              width: "100%",
                              height: "24px",
                              borderRadius: "3px",
                              border: "1px solid rgba(0, 0, 0, 0.05)",
                              cursor: "pointer",
                              backgroundColor: color,
                              transition: "transform 0.15s ease"
                            }}
                            onClick={() => {
                              if (onCellClick) {
                                onCellClick(cell || { corridor, date: isHourly ? `Hour ${col}:00` : col, risk_level: "none", predicted_event_type: "No Events Predicted" });
                              }
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            aria-label={`Risk level for ${corridor} on ${col} is ${cell?.risk_level || "unknown"}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskHeatmap;
