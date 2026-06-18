import { useState } from "react";
import { postForecast } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import ErrorState from "./ErrorState";
import { FaClock, FaUsers, FaExclamationTriangle, FaRoute, FaArrowRight, FaPlay } from "react-icons/fa";

const USE_MOCK = false; // flip to false once live endpoints are active

function ForecastPanel() {
  const [corridor, setCorridor] = useState("Mysore Road");
  const [eventType, setEventType] = useState("Procession");
  const [date, setDate] = useState("2026-06-17");
  const [time, setTime] = useState("08:30");

  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const corridors = [
    "Mysore Road",
    "Bellary Road 1",
    "Tumkur Road",
    "Bellary Road 2",
    "Hosur Road",
    "ORR North 1",
    "Old Madras Road",
    "Magadi Road",
    "ORR East 1",
    "ORR North 2",
    "Bannerghatta Road",
    "ORR East 2",
    "West of Chord Road",
    "ORR West 1",
    "CBD 2",
    "Hennur Main Road",
    "IRR(Thanisandra road)",
    "Varthur Road",
    "Old Airport Road",
    "MG Road",
    "Indiranagar 100 Feet Rd",
    "Silk Board Junction",
    "Outer Ring Road"
  ];

  const eventTypes = [
    "Accident",
    "Road Blockage",
    "Traffic Jam",
    "Waterlogging",
    "Procession",
    "Metro Work",
    "Rally / Protest"
  ];

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForecast(null);

    try {
      if (USE_MOCK) {
        // Fallback simulation mode
        await new Promise((r) => setTimeout(r, 1000));
        setForecast({
          event_type: eventType,
          corridor: corridor,
          severity: "Medium",
          congestion_duration_minutes: 60,
          manpower_recommended: "Low",
          diversion_routes: ["Follow local signage"],
          recommended_station: "Unknown Traffic Station",
          similar_past_events: [],
          simulatedAt: `${date} at ${time}`
        });
      } else {
        // Map select categories to model expected keys
        const MAP_CAUSE_TO_DB = {
          "Accident": "accident",
          "Road Blockage": "others",
          "Traffic Jam": "congestion",
          "Waterlogging": "water_logging",
          "Procession": "public_event",
          "Metro Work": "construction",
          "Rally / Protest": "others"
        };

        const event_cause = MAP_CAUSE_TO_DB[eventType] || "others";
        const event_type = ["procession", "metro work", "rally / protest"].includes(eventType.toLowerCase()) ? "Planned" : "Unplanned";
        const cleanCorridor = corridor === "Bannerghatta Road" ? "Bannerghata Road" : corridor;
        const start_datetime = new Date(`${date}T${time}:00`).toISOString();

        const response = await postForecast({
          event_cause,
          event_type,
          corridor: cleanCorridor,
          requires_road_closure: false,
          start_datetime
        });

        const data = response.data;
        setForecast({
          event_type: eventType,
          corridor: corridor,
          severity: data.predicted_priority || "Low",
          congestion_duration_minutes: data.predicted_duration_minutes ? Math.round(data.predicted_duration_minutes) : 60,
          manpower_recommended: data.manpower_band || "Low",
          diversion_routes: data.suggested_diversion ? [data.suggested_diversion] : ["No diversion recommended"],
          recommended_station: data.recommended_station || "Central Traffic Control",
          similar_past_events: data.similar_past_events || [],
          simulatedAt: `${date} at ${time}`
        });
      }
    } catch (err) {
      setError("Prediction server timed out or returned an error. Check backend connectivity.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high": return "high";
      case "medium": return "medium";
      case "low": return "low";
      default: return "";
    }
  };

  return (
    <div className="forecast-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
        Event Response Simulation
      </h3>

      {/* Simulation Inputs Form */}
      <form onSubmit={handlePredict} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase" }}>Incident Type</label>
            <select 
              value={eventType} 
              onChange={(e) => setEventType(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "var(--text-primary)",
                outline: "none"
              }}
            >
              {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase" }}>Corridor Target</label>
            <select 
              value={corridor} 
              onChange={(e) => setCorridor(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                fontSize: "13px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "var(--text-primary)",
                outline: "none"
              }}
            >
              {corridors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase" }}>Target Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: "13px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "var(--text-primary)",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase" }}>Target Time</label>
            <input 
              type="time" 
              value={time} 
              onChange={(e) => setTime(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                fontSize: "13px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "var(--text-primary)",
                outline: "none"
              }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{
            background: "var(--accent-primary)",
            color: "white",
            border: "none",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 700,
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginTop: "6px",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent-hover)"; }}
          onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent-primary)"; }}
        >
          <FaPlay style={{ fontSize: "10px" }} />
          {loading ? "Simulating Impact..." : "Run Dispatch Simulation"}
        </button>
      </form>

      {/* Result / Loading / Error Display Area */}
      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", minHeight: "150px" }}>
        {loading && <LoadingSpinner message="Simulating incident impact parameters..." />}

        {error && <ErrorState message={error} onRetry={handlePredict} retryLabel="Rerun Simulation" />}

        {!forecast && !loading && !error && (
          <div className="empty-forecast-state" style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "30px 0",
            color: "var(--text-secondary)",
            textAlign: "center",
            gap: "10px"
          }}>
            <FaRoute className="empty-forecast-icon" style={{ fontSize: "28px", opacity: 0.5 }} />
            <span style={{ fontSize: "13px", fontWeight: 500 }}>No active simulation. Configure inputs and click predict.</span>
          </div>
        )}

        {forecast && !loading && !error && (
          <div className="forecast-result" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="result-row" style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
              <span className="result-label" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Simulation Run</span>
              <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{forecast.simulatedAt}</strong>
            </div>

            <div className="result-row" style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
              <span className="result-label" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                <FaExclamationTriangle style={{ marginRight: "6px", color: "var(--severity-warning)" }} />
                Congestion Severity
              </span>
              <span className={`result-value severity-badge ${getSeverityClass(forecast.severity)}`} style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "3px",
                backgroundColor: forecast.severity === "High" ? "#fee2e2" : "#fef3c7",
                color: forecast.severity === "High" ? "var(--severity-risk)" : "var(--severity-warning)"
              }}>
                {forecast.severity} Impact
              </span>
            </div>

            <div className="result-row" style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
              <span className="result-label" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                <FaClock style={{ marginRight: "6px", color: "var(--text-secondary)" }} />
                Delay Estimation
              </span>
              <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{forecast.congestion_duration_minutes} Mins</strong>
            </div>

            <div className="result-row" style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
              <span className="result-label" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                <FaUsers style={{ marginRight: "6px", color: "var(--text-secondary)" }} />
                Required Dispatch
              </span>
              <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{forecast.manpower_recommended} Band</strong>
            </div>

            <div className="result-row" style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
              <span className="result-label" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                📍 Recommended Station
              </span>
              <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{forecast.recommended_station}</strong>
            </div>

            <div>
              <span className="result-label" style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                <FaRoute style={{ marginRight: "6px", color: "var(--accent-primary)" }} />
                Alternate Route Diversions
              </span>
              <div className="diversions-list" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {forecast.diversion_routes.map((route, i) => (
                  <div key={i} className="diversion-item" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid var(--border-color)",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontSize: "12.5px",
                    color: "var(--text-primary)",
                    fontWeight: 500
                  }}>
                    <FaArrowRight style={{ fontSize: "10px", color: "var(--accent-primary)" }} />
                    <span>{route}</span>
                  </div>
                ))}
              </div>
            </div>

            {forecast.similar_past_events && forecast.similar_past_events.length > 0 && (
              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                <span className="result-label" style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: "var(--text-secondary)", fontWeight: 700 }}>
                  🔍 Similar Historical Analogue Cases
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {forecast.similar_past_events.map((evt, idx) => (
                    <div key={idx} style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid var(--border-color)",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <div>
                        <strong style={{ color: "var(--text-primary)" }}>{evt.event_cause ? evt.event_cause.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Incident"}</strong>
                        <span style={{ color: "var(--text-secondary)", marginLeft: "8px" }}>on {evt.corridor || "Unknown"}</span>
                      </div>
                      <span style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "3px",
                        backgroundColor: evt.priority?.toLowerCase() === "high" ? "#fee2e2" : "#fef3c7",
                        color: evt.priority?.toLowerCase() === "high" ? "var(--severity-risk)" : "var(--severity-warning)"
                      }}>{evt.priority} ({evt.duration_minutes ? Math.round(evt.duration_minutes) : 60}m)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForecastPanel;