import { useState, useEffect } from "react";
import API from "../services/api";
import { mockRiskCalendar } from "../services/mockRiskCalendar";
import { FaFire } from "react-icons/fa";

const USE_MOCK = true; // Set to false to swap for a live /risk-calendar API call later

function RiskHeatmap({ onCellClick }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRiskData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (USE_MOCK) {
          // Simulate latency
          await new Promise((resolve) => setTimeout(resolve, 800));
          setData(mockRiskCalendar);
        } else {
          const response = await API.get("/risk-calendar");
          setData(response.data);
        }
      } catch (err) {
        console.error("Error fetching risk calendar:", err);
        setError("Failed to load risk heatmap. Backend may be offline.");
      } finally {
        setLoading(false);
      }
    };

    fetchRiskData();
  }, []);

  // Extract unique dates and corridors
  const dates = [...new Set(data.map((item) => item.date))].sort();
  const corridors = [...new Set(data.map((item) => item.corridor))].sort();

  const getCellData = (corridor, date) => {
    return data.find((item) => item.corridor === corridor && item.date === date);
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

  const formatDateLabel = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="heatmap-card glass-panel" style={{ padding: "20px" }}>
      <div className="heatmap-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
        <div className="heatmap-title-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaFire className="heatmap-icon" style={{ color: "var(--severity-risk)" }} />
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>7-Day Corridor Risk Heatmap</h2>
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

      {!loading && !error && data.length > 0 && (
        <div className="heatmap-content-wrapper">
          <div className="heatmap-grid-scroll" style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
            <table className="heatmap-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th className="corridor-header-cell" style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: 700, textAlign: "left", fontSize: "11px" }}>CORRIDOR</th>
                  {dates.map((date) => (
                    <th key={date} className="date-header-cell" style={{ padding: "10px 14px", color: "var(--text-secondary)", fontWeight: 700, textAlign: "center", fontSize: "11px" }}>
                      {formatDateLabel(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corridors.map((corridor) => (
                  <tr key={corridor} style={{ borderTop: "1px solid var(--border-color)" }}>
                    <td className="corridor-name-cell" style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text-primary)" }}>{corridor}</td>
                    {dates.map((date) => {
                      const cell = getCellData(corridor, date);
                      const color = getRiskColor(cell?.risk_level);
                      
                      return (
                        <td key={date} className="heatmap-cell-wrapper" style={{ padding: "6px", textAlign: "center" }}>
                          <button
                            id={`cell-${corridor.replace(/\s+/g, "-").toLowerCase()}-${date}`}
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
                                onCellClick(cell || { corridor, date, risk_level: "none", predicted_event_type: "No Events Predicted" });
                              }
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.08)"}
                            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
                            aria-label={`Risk level for ${corridor} on ${date} is ${cell?.risk_level || "unknown"}`}
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
