import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaTrafficLight } from "react-icons/fa";

function Navbar() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="navbar glass-panel">
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
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="nav-status" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="status-dot-active" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--severity-safe)" }}></span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#f8fafc" }}>SYSTEM STATUS: ONLINE</span>
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
          LIVE FEED: <span style={{ color: "white" }}>{time}</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
