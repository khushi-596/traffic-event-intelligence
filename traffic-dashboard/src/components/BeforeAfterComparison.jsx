import { FaTrafficLight, FaCheckCircle, FaPercent } from "react-icons/fa";

function BeforeAfterComparison() {
  const corridors = [
    { name: "Silk Board Junction", before: 92, after: 64, reduction: 30 },
    { name: "Outer Ring Road", before: 85, after: 55, reduction: 35 },
    { name: "Mysore Road", before: 78, after: 48, reduction: 38 },
  ];

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FaPercent style={{ color: "var(--accent-primary)" }} />
        Enforcement Impact Assessment
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {corridors.map((c, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</span>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--severity-safe)",
                backgroundColor: "#d1fae5",
                padding: "2px 6px",
                borderRadius: "3px"
              }}>-{c.reduction}% Congestion</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* Before Card */}
              <div style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fee2e2",
                padding: "10px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaTrafficLight style={{ color: "var(--severity-risk)", fontSize: "18px" }} />
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#991b1b", fontWeight: 600, textTransform: "uppercase" }}>Pre-Enforce</span>
                  <strong style={{ fontSize: "14px", color: "#7f1d1d" }}>Index: {c.before}</strong>
                </div>
              </div>

              {/* After Card */}
              <div style={{
                backgroundColor: "#ecfdf5",
                border: "1px solid #d1fae5",
                padding: "10px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaCheckCircle style={{ color: "var(--severity-safe)", fontSize: "18px" }} />
                <div>
                  <span style={{ display: "block", fontSize: "10px", color: "#065f46", fontWeight: 600, textTransform: "uppercase" }}>Post-Enforce</span>
                  <strong style={{ fontSize: "14px", color: "#064e3b" }}>Index: {c.after}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BeforeAfterComparison;
