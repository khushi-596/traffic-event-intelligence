import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";

function Modal({ isOpen, onClose, title, children }) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.2s ease-out"
    }} onClick={onClose}>
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "6px",
        width: "90%",
        maxWidth: "520px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        animation: "slideIn 0.2s ease-out"
      }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          backgroundColor: "var(--bg-nav)",
          color: "white"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, letterSpacing: "0.5px" }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.color = "white"}
            onMouseOut={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)"}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
