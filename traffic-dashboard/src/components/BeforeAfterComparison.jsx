import { FaTrafficLight, FaCheckCircle, FaPercent } from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import ErrorState from "./ErrorState";

function BeforeAfterComparison({ feedbackMetrics = [], loading = false, error = null }) {
  let metricsData = [];
  let title = "Model Learning Improvement Trends";

  if (feedbackMetrics && feedbackMetrics.length > 0) {
    if (feedbackMetrics.length === 1) {
      title = "Model Performance Snapshot";
      const metric = feedbackMetrics[0];

      const currentMAE = metric.rolling_mae || 0;
      const currentAcc = (metric.rolling_accuracy || 0) * 100;
      const currentErr = metric.duration_error || 0;

      metricsData = [
        { 
          name: "Model Rolling Error (MAE)", 
          before: parseFloat(currentMAE.toFixed(1)), 
          after: parseFloat(currentMAE.toFixed(1)), 
          diff: 0,
          beforeLabel: "Initial MAE",
          afterLabel: "Current MAE",
          beforeUnit: "m",
          afterUnit: "m",
          isErrorMetric: true
        },
        { 
          name: "Priority Classification Accuracy", 
          before: parseFloat(currentAcc.toFixed(1)), 
          after: parseFloat(currentAcc.toFixed(1)), 
          diff: 0,
          beforeLabel: "Initial Acc",
          afterLabel: "Current Acc",
          beforeUnit: "%",
          afterUnit: "%",
          isErrorMetric: false
        },
        { 
          name: "Average Incident Duration Error", 
          before: parseFloat(currentErr.toFixed(1)), 
          after: parseFloat(currentErr.toFixed(1)), 
          diff: 0,
          beforeLabel: "First Error",
          afterLabel: "Recent Error",
          beforeUnit: "m",
          afterUnit: "m",
          isErrorMetric: true
        }
      ];
    } else {
      const firstMetric = feedbackMetrics[0];
      const lastMetric = feedbackMetrics[feedbackMetrics.length - 1];

      const beforeMAE = firstMetric.rolling_mae || 0;
      const afterMAE = lastMetric.rolling_mae || 0;
      const maeDiff = beforeMAE > 0 ? Math.round(((afterMAE - beforeMAE) / beforeMAE) * 100) : 0;

      const beforeAcc = (firstMetric.rolling_accuracy || 0) * 100;
      const afterAcc = (lastMetric.rolling_accuracy || 0) * 100;
      const accDiff = beforeAcc > 0 ? Math.round(((afterAcc - beforeAcc) / beforeAcc) * 100) : 0;

      const beforeErr = firstMetric.duration_error || 0;
      const afterErr = lastMetric.duration_error || 0;
      const errDiff = beforeErr > 0 ? Math.round(((afterErr - beforeErr) / beforeErr) * 100) : 0;

      metricsData = [
        { 
          name: "Model Rolling Error (MAE)", 
          before: parseFloat(beforeMAE.toFixed(1)), 
          after: parseFloat(afterMAE.toFixed(1)), 
          diff: maeDiff,
          beforeLabel: "Initial MAE",
          afterLabel: "Current MAE",
          beforeUnit: "m",
          afterUnit: "m",
          isErrorMetric: true
        },
        { 
          name: "Priority Classification Accuracy", 
          before: parseFloat(beforeAcc.toFixed(1)), 
          after: parseFloat(afterAcc.toFixed(1)), 
          diff: accDiff,
          beforeLabel: "Initial Acc",
          afterLabel: "Current Acc",
          beforeUnit: "%",
          afterUnit: "%",
          isErrorMetric: false
        },
        { 
          name: "Average Incident Duration Error", 
          before: parseFloat(beforeErr.toFixed(1)), 
          after: parseFloat(afterErr.toFixed(1)), 
          diff: errDiff,
          beforeLabel: "First Error",
          afterLabel: "Recent Error",
          beforeUnit: "m",
          afterUnit: "m",
          isErrorMetric: true
        }
      ];
    }
  }

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FaPercent style={{ color: "var(--accent-primary)" }} />
        {title}
      </h3>

      {loading && <LoadingSpinner message="Calculating error clearance..." />}
      {error && <ErrorState message={error} />}

      {!loading && !error && metricsData.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 0", gap: "12px", color: "var(--text-secondary)", textAlign: "center" }}>
          <FaTrafficLight style={{ fontSize: "32px", opacity: 0.3 }} />
          <p style={{ fontSize: "13px", maxWidth: "250px" }}>Awaiting event resolution feedback. Close active events to initialize model learning metrics.</p>
        </div>
      )}

      {!loading && !error && metricsData.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {metricsData.map((c, i) => {
            let badgeText = "No Change";
            let badgeColor = "var(--text-secondary)";
            let badgeBg = "#f1f5f9";

            if (c.diff !== 0) {
              if (c.isErrorMetric) {
                if (c.diff > 0) {
                  badgeText = `${c.diff}% Increase`;
                  badgeColor = "#991b1b";
                  badgeBg = "#fef2f2";
                } else {
                  badgeText = `${Math.abs(c.diff)}% Reduction`;
                  badgeColor = "var(--severity-safe)";
                  badgeBg = "#d1fae5";
                }
              } else {
                if (c.diff > 0) {
                  badgeText = `${c.diff}% Improvement`;
                  badgeColor = "var(--severity-safe)";
                  badgeBg = "#d1fae5";
                } else {
                  badgeText = `${Math.abs(c.diff)}% Decline`;
                  badgeColor = "#991b1b";
                  badgeBg = "#fef2f2";
                }
              }
            }

            return (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: badgeColor,
                  backgroundColor: badgeBg,
                  padding: "2px 6px",
                  borderRadius: "3px"
                }}>{badgeText}</span>
              </div>
              
              <div className="before-after-grid">
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
                    <span style={{ display: "block", fontSize: "10px", color: "#991b1b", fontWeight: 600, textTransform: "uppercase" }}>{c.beforeLabel}</span>
                    <strong style={{ fontSize: "14px", color: "#7f1d1d" }}>{c.before}{c.beforeUnit}</strong>
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
                    <span style={{ display: "block", fontSize: "10px", color: "#065f46", fontWeight: 600, textTransform: "uppercase" }}>{c.afterLabel}</span>
                    <strong style={{ fontSize: "14px", color: "#064e3b" }}>{c.after}{c.afterUnit}</strong>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

export default BeforeAfterComparison;
