import { useState, useEffect } from "react";
import { FaServer, FaBrain, FaDatabase, FaCircle } from "react-icons/fa";
import { getHealth } from "../services/api";

function SystemStatus() {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    try {
      const res = await getHealth();
      setHealth(res.data);
      setError(null);
    } catch (err) {
      console.error("Health check failed:", err);
      setError("Telemetry connection lost");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 5000);

    const healthTimer = setInterval(fetchHealth, 10000);

    const initialTimer = setTimeout(() => {
      fetchHealth();
    }, 0);

    return () => {
      clearInterval(statusTimer);
      clearInterval(healthTimer);
      clearTimeout(initialTimer);
    };
  }, []);

  const getStatusBadge = (status, name) => {
    if (status === "online" && name === "Global Operations Mode") {
      return {
        bg: "#d1fae5",
        color: "var(--severity-safe)",
        border: "#6ee7b7",
        label: "LIVE ACTIVE"
      };
    }
    switch (status) {
      case "online":
        return {
          bg: "#d1fae5",
          color: "var(--severity-safe)",
          border: "#6ee7b7",
          label: "CONNECTED"
        };
      case "loading":
        return {
          bg: "#f8fafc",
          color: "var(--text-secondary)",
          border: "var(--border-color)",
          label: "CHECKING..."
        };
      case "offline":
      default:
        return {
          bg: "#fee2e2",
          color: "var(--severity-risk)",
          border: "#fca5a5",
          label: "OFFLINE"
        };
    }
  };

  const systems = [
    { 
      name: "Backend Dispatch API", 
      status: loading && !health ? "loading" : (health?.status === "ok" ? "online" : "offline"), 
      icon: <FaServer /> 
    },
    { 
      name: "ML Prediction Service", 
      status: loading && !health ? "loading" : (health?.ml_service === "connected" ? "online" : "offline"), 
      icon: <FaBrain /> 
    },
    { 
      name: "PostGIS Incident DB", 
      status: loading && !health ? "loading" : (health?.database === "connected" ? "online" : "offline"), 
      icon: <FaDatabase /> 
    },
    { 
      name: "Global Operations Mode", 
      status: loading && !health ? "loading" : (health?.status === "ok" && health?.database === "connected" && health?.ml_service === "connected" ? "online" : "offline"), 
      icon: <FaCircle /> 
    }
  ];

  return (
    <div className="system-status-panel glass-panel" style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 20px",
      flexWrap: "wrap",
      gap: "12px"
    }}>
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {systems.map((sys, idx) => {
          const badge = getStatusBadge(sys.status, sys.name);
          return (
            <div key={idx} style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px"
            }}>
              <span style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                {sys.icon}
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{sys.name}:</span>
              <span style={{
                fontSize: "10px",
                fontWeight: 700,
                backgroundColor: badge.bg,
                color: badge.color,
                borderColor: badge.border,
                border: "1px solid",
                padding: "2px 6px",
                borderRadius: "3px",
                letterSpacing: "0.5px"
              }}>
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{
        fontSize: "12px",
        color: error ? "var(--severity-risk)" : "var(--text-secondary)",
        fontWeight: 500,
        letterSpacing: "0.2px"
      }}>
        {error ? `⚠️ ${error}` : `Telemetry Updated: `}<strong>{timestamp}</strong>
      </div>
    </div>
  );
}

export default SystemStatus;
