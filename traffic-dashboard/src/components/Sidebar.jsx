import { Link, useLocation } from "react-router-dom";
import { FaHome, FaChartBar, FaChevronRight } from "react-icons/fa";

function Sidebar() {
  const location = useLocation();

  const links = [
    { name: "Command Home", path: "/", icon: <FaHome /> },
    { name: "Live Dashboard", path: "/dashboard", icon: <FaChartBar /> },
  ];

  const stats = [
    { label: "Pending Alerts", value: "3 Critical" },
    { label: "Active Officers", value: "42 Deployed" },
    { label: "Model Mode", value: "Mock Engine" }
  ];

  return (
    <div className="glass-panel" style={{
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "24px",
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
                padding: "10px 14px",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
        <h4 style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px" }}>
          Command Summary
        </h4>
        
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            backgroundColor: "#f8fafc",
            border: "1px solid var(--border-color)",
            borderRadius: "4px"
          }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>{stat.label}</span>
            <strong style={{ fontSize: "12px", color: "var(--text-primary)" }}>{stat.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
