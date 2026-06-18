import { useState, useEffect } from "react";
import Modal from "./Modal";
import { postFeedback } from "../services/api";

function ResolutionFeedbackModal({ isOpen, onClose, event, onFeedbackSubmit }) {
  const [actualDuration, setActualDuration] = useState("");
  const [actualPriority, setActualPriority] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState("Cleared");
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event && isOpen) {
      // Pre-fill with predicted/estimated values if available
      const estDuration = event.predicted_duration || event.estimated_duration || event.duration_minutes || "";
      setActualDuration(estDuration ? Math.round(estDuration).toString() : "");
      setActualPriority(event.priority || "Low");
      setResolutionStatus("Cleared");
      setNotes("");
      setError(null);
    }
  }, [event, isOpen]);

  if (!event) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actualDuration || isNaN(actualDuration)) {
      setError("Please enter a valid actual duration in minutes.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        event_id: event.id.toString(),
        actual_duration_minutes: parseFloat(actualDuration),
        actual_priority: actualPriority
      };

      await postFeedback(payload);
      
      // On success, close this modal and trigger the dashboard refresh callback
      setIsSubmitting(false);
      onFeedbackSubmit();
      onClose();
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setError(err.response?.data?.detail || "Failed to submit feedback to learning loop.");
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={!isSubmitting ? onClose : undefined} title="Resolve Incident & Submit Feedback">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", padding: "12px", borderRadius: "4px", fontSize: "13px", color: "#0369a1" }}>
          <strong style={{ display: "block", marginBottom: "4px" }}>Machine Learning Feedback Loop</strong>
          Submitting the final actuals of this incident will feed directly into the predictive models to improve future forecasting accuracy and reduce duration MAE.
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "10px", borderRadius: "4px", fontSize: "13px", border: "1px solid #fecaca" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              Actual Duration (Minutes) *
            </label>
            <input 
              type="number" 
              value={actualDuration}
              onChange={(e) => setActualDuration(e.target.value)}
              disabled={isSubmitting}
              required
              style={{
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              Final Severity (Actual) *
            </label>
            <select 
              value={actualPriority}
              onChange={(e) => setActualPriority(e.target.value)}
              disabled={isSubmitting}
              style={{
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
                outline: "none"
              }}
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              Resolution Status
            </label>
            <select 
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
              disabled={isSubmitting}
              style={{
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                fontSize: "14px",
                backgroundColor: "white",
                outline: "none"
              }}
            >
              <option value="Cleared">Cleared & Traffic Flowing</option>
              <option value="Transferred">Transferred to Local Authority</option>
              <option value="Monitored">De-escalated to Passive Monitoring</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
              After-Action Notes (Optional)
            </label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. Tow truck arrived 10 mins late due to gridlock..."
              style={{
                padding: "10px 12px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                fontSize: "14px",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                background: "var(--severity-safe)",
                color: "white",
                border: "none",
                padding: "10px 16px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "4px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Resolution & Retrain"}
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
}

export default ResolutionFeedbackModal;
