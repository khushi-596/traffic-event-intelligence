import { useState, useEffect } from "react";
import Modal from "./Modal";
import ResolutionFeedbackModal from "./ResolutionFeedbackModal";

function EventDetailsModal({ isOpen, onClose, event, onFeedbackSubmit }) {
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset state when modal opens with a new event
  useEffect(() => {
    if (isOpen) {
      setShowFeedback(false);
    }
  }, [isOpen, event]);

  if (!event) return null;

  if (showFeedback) {
    return (
      <ResolutionFeedbackModal 
        isOpen={isOpen} 
        onClose={() => { setShowFeedback(false); onClose(); }} 
        event={event} 
        onFeedbackSubmit={() => {
          setShowFeedback(false);
          if (onFeedbackSubmit) onFeedbackSubmit();
        }}
      />
    );
  }

  // console.log("Selected Event:", event);

  const getPriorityBadgeStyles = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return { backgroundColor: "#fee2e2", color: "#7f1d1d", borderColor: "#fda4af" };
      case "high":
        return { backgroundColor: "#fee2e2", color: "var(--severity-risk)", borderColor: "#fca5a5" };
      case "medium":
        return { backgroundColor: "#fef3c7", color: "var(--severity-warning)", borderColor: "#fcd34d" };
      case "low":
      default:
        return { backgroundColor: "#d1fae5", color: "var(--severity-safe)", borderColor: "#6ee7b7" };
    }
  };

  const badgeStyles = getPriorityBadgeStyles(event.severity || "low");

  // Mock additional data matching the requirements
  const mockAssignedStation = event.assigned_station || `${event.corridor.split(" ")[0] || "Central"} Traffic Police Station`;
  
  const estimatedDuration =
    event.predicted_duration ??
    event.estimated_duration ??
    "Unknown Duration";

  const mockRecommendedManpower = event.manpower_recommended || "6 Officers, 2 Tow Trucks";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Incident Investigation Details">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Top Header Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>INCIDENT #{event.id || "TEMP"}</span>
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: "4px",
            border: "1px solid",
            ...badgeStyles
          }}>
            {event.severity || "Low"} Severity
          </span>
        </div>

        {/* Detailed Stats */}
        <div className="event-details-grid" style={{
          backgroundColor: "#f8fafc",
          padding: "16px",
          borderRadius: "4px",
          border: "1px solid var(--border-color)"
        }}>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Event Type</span>
            <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{event.event_type}</strong>
          </div>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Target Corridor</span>
            <strong style={{ fontSize: "14px", color: "var(--text-primary)" }}>{event.corridor}</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Assigned Station</span>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{mockAssignedStation}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Estimated Duration</span>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{estimatedDuration}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Recommended Deployment</span>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{mockRecommendedManpower}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Coordinates</span>
            <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>{event.lat?.toFixed(4)}, {event.lng?.toFixed(4)}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button 
            onClick={onClose} 
            style={{
              flex: 1,
              background: "transparent",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "4px",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f1f5f9"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            Acknowledge Dispatch
          </button>

          <button 
            onClick={() => setShowFeedback(true)} 
            style={{
              flex: 1,
              background: "var(--severity-safe)",
              color: "white",
              border: "none",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "4px",
              cursor: "pointer",
              transition: "opacity 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
          >
            Resolve Incident
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default EventDetailsModal;
