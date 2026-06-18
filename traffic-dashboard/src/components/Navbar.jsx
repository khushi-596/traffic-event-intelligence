import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTrafficLight } from "react-icons/fa";

function Navbar() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [lastUpdated, setLastUpdated] = useState(() => {
    return new Date(Date.now() - 120000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    // Periodically refresh last updated timestamp
    const updateTimer = setInterval(() => {
      const newUpdateTime = new Date(Date.now() - 30000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLastUpdated(newUpdateTime);
    }, 60000);

    return () => {
      clearInterval(timer);
      clearInterval(updateTimer);
    };
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
        <FaTrafficLight style={{ fontSize: "28px", color: "#3b82f6" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "white", letterSpacing: "1px", lineHeight: "1.2" }}>
            GRIDLOCK BENGALURU
          </h1>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.5px" }}>
            Traffic Command Center
          </span>
        </div>
      </Link>
      
      <div className="nav-controls" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* System Status */}
        <div className="nav-control-item" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="status-dot-active" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--severity-safe)" }}></span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#f8fafc" }}>SYSTEM: ONLINE</span>
        </div>
        
        {/* Divider */}
        <span style={{ color: "#334155", fontSize: "12px" }}>|</span>

        {/* Data Source */}
        <div className="nav-control-item" style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
          DATA SOURCE: <span style={{ color: "#3b82f6", fontWeight: 700 }}>ASTRAM</span>
        </div>

        {/* Divider */}
        <span style={{ color: "#334155", fontSize: "12px" }}>|</span>

        {/* Last Updated */}
        <div className="nav-control-item" style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
          LAST UPDATED: <span style={{ color: "white" }}>{lastUpdated}</span>
        </div>

        {/* Divider */}
        <span style={{ color: "#334155", fontSize: "12px" }}>|</span>

        {/* Live clock */}
        <div className="nav-control-item" style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
          LIVE FEED: <span style={{ color: "white" }}>{time}</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

