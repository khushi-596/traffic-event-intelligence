import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaChartBar, FaChevronRight, FaRobot, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { postRetrain } from "../services/api";

function Sidebar({ events = [], loading = false, onRetrainSuccess }) {
  const location = useLocation();
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState(null);

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainResult(null);
    try {
      const res = await postRetrain();
      setRetrainResult({ type: 'success', message: res.data.message || "Models successfully retrained." });
      if (onRetrainSuccess) onRetrainSuccess();
    } catch (err) {
      setRetrainResult({ type: 'error', message: err.response?.data?.detail || "Failed to trigger retraining." });
    } finally {
      setIsRetraining(false);
    }
  };

  const links = [
    { name: "Command Home", path: "/", icon: <FaHome /> },
    { name: "Live Dashboard", path: "/dashboard", icon: <FaChartBar /> },
  ];

  const pendingCount = events.filter(e => e.status?.toLowerCase() !== 'closed').length;
  const criticalCount = events.filter(e => e.priority?.toLowerCase() === 'critical' || e.priority?.toLowerCase() === 'high').length;

  const stats = [
    { label: "Pending Alerts", value: loading ? "Loading..." : `${pendingCount} Active` },
    { label: "Critical Alerts", value: loading ? "Loading..." : `${criticalCount} High/Crit` },
    { label: "Model Mode", value: "Live FastAPI" }
  ];

  return (
    <div className="glass-panel operations-menu" style={{
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      height: "100%",
      backgroundColor: "var(--bg-secondary)"
    }}>
      {/* Navigation Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h4 style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
          Operations Menu
        </h4>
        {links.map((link, idx) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={idx} 
              to={link.path} 
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                color: isActive ? "white" : "var(--text-primary)",
                backgroundColor: isActive ? "var(--bg-nav)" : "transparent",
                border: "1px solid",
                borderColor: isActive ? "var(--bg-nav)" : "transparent",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ display: "flex", alignItems: "center", color: isActive ? "white" : "var(--accent-primary)" }}>
                  {link.icon}
                </span>
                <span>{link.name}</span>
              </div>
              <FaChevronRight style={{ fontSize: "10px", opacity: isActive ? 0.8 : 0.3 }} />
            </Link>
          );
        })}
      </div>

      {/* Operational Stats Summary */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
        <h4 style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
          Command Summary
        </h4>
        
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 10px",
            backgroundColor: "#f8fafc",
            border: "1px solid var(--border-color)",
            borderRadius: "4px"
          }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{stat.label}</span>
            <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>{stat.value}</strong>
          </div>
        ))}
      </div>
      {/* Admin Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
        <h4 style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
          Admin Actions
        </h4>
        
        <button 
          onClick={handleRetrain}
          disabled={isRetraining}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "white",
            color: "var(--accent-primary)",
            border: "1px solid var(--border-color)",
            padding: "10px",
            fontSize: "13px",
            fontWeight: 600,
            borderRadius: "4px",
            cursor: isRetraining ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            opacity: isRetraining ? 0.7 : 1
          }}
          onMouseOver={(e) => { if (!isRetraining) e.currentTarget.style.background = "#f1f5f9"; }}
          onMouseOut={(e) => { if (!isRetraining) e.currentTarget.style.background = "white"; }}
        >
          <FaRobot style={{ fontSize: "14px" }} />
          {isRetraining ? "Retraining Models..." : "Retrain ML Models"}
        </button>

        {retrainResult && (
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
            padding: "8px",
            backgroundColor: retrainResult.type === 'success' ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${retrainResult.type === 'success' ? "#d1fae5" : "#fecaca"}`,
            borderRadius: "4px",
            fontSize: "11px",
            color: retrainResult.type === 'success' ? "#065f46" : "#991b1b",
            marginTop: "4px"
          }}>
            {retrainResult.type === 'success' ? <FaCheckCircle style={{ marginTop: "2px", flexShrink: 0 }} /> : <FaExclamationCircle style={{ marginTop: "2px", flexShrink: 0 }} />}
            <span>{retrainResult.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
