import { useState, useEffect } from "react";
import { FaServer, FaBrain, FaDatabase, FaCircle } from "react-icons/fa";

function SystemStatus() {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "online":
        return {
          bg: "#d1fae5",
          color: "var(--severity-safe)",
          border: "#6ee7b7",
          label: "CONNECTED"
        };
      case "mock":
        return {
          bg: "#fef3c7",
          color: "var(--severity-warning)",
          border: "#fcd34d",
          label: "MOCK ACTIVE"
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
    { name: "Backend Dispatch API", status: "online", icon: <FaServer /> },
    { name: "ML Prediction Service", status: "online", icon: <FaBrain /> },
    { name: "PostGIS Incident DB", status: "online", icon: <FaDatabase /> },
    { name: "Global Operations Mode", status: "mock", icon: <FaCircle /> }
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
          const badge = getStatusBadge(sys.status);
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
        color: "var(--text-secondary)",
        fontWeight: 500,
        letterSpacing: "0.2px"
      }}>
        Telemetry Updated: <strong>{timestamp}</strong>
      </div>
    </div>
  );
}

export default SystemStatus;
