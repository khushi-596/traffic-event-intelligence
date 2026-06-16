import { FaBell, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

function NotificationPanel() {
  const alerts = [
    {
      id: 1,
      type: "alert",
      message: "High Risk Event Predicted: VIP Movement on Mysore Road forecasted for tomorrow.",
      time: "2 mins ago"
    },
    {
      id: 2,
      type: "warning",
      message: "Expected Heavy Congestion: Waterlogging incident active at Silk Board Junction.",
      time: "15 mins ago"
    },
    {
      id: 3,
      type: "info",
      message: "Metro Construction active: Bannerghatta Road lane reduction expected all week.",
      time: "1 hour ago"
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FaBell style={{ color: "var(--severity-warning)" }} />
        Command Center Alerts
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {alerts.map((a) => (
          <div key={a.id} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "12px",
            borderRadius: "4px",
            border: `1px solid ${
              a.type === "alert" ? "#fecaca" : a.type === "warning" ? "#fef3c7" : "#e2e8f0"
            }`,
            backgroundColor: `${
              a.type === "alert" ? "#fff5f5" : a.type === "warning" ? "#fffdf5" : "#f8fafc"
            }`,
          }}>
            <span style={{
              marginTop: "2px",
              color: `${
                a.type === "alert" ? "var(--severity-risk)" : a.type === "warning" ? "var(--severity-warning)" : "var(--severity-info)"
              }`
            }}>
              {a.type === "alert" ? <FaExclamationTriangle /> : <FaInfoCircle />}
            </span>
            <div style={{ flexGrow: 1 }}>
              <p style={{
                fontSize: "13px",
                lineHeight: "1.5",
                margin: 0,
                color: "#1e293b",
                fontWeight: 500
              }}>{a.message}</p>
              <span style={{
                fontSize: "10px",
                color: "var(--text-secondary)",
                fontWeight: 600,
                display: "block",
                marginTop: "4px"
              }}>{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationPanel;
