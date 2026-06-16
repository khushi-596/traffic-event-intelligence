import { useState } from "react";
import { FaSearch, FaFilter, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { mockEvents } from "../services/mockEvents";

function LiveEventsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // Augment mockEvents with status and duration for display
  const events = mockEvents.map((evt) => {
    let status = "Active";
    let duration = "30m";
    if (evt.id === 1) { status = "Dispatched"; duration = "75m"; }
    else if (evt.id === 2) { status = "Active"; duration = "45m"; }
    else if (evt.id === 3) { status = "Monitoring"; duration = "20m"; }
    else if (evt.id === 4) { status = "Escalated"; duration = "120m"; }
    else if (evt.id === 5) { status = "Active"; duration = "50m"; }

    return {
      ...evt,
      status,
      duration
    };
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return { backgroundColor: "#fee2e2", color: "var(--severity-risk)", border: "1px solid #fca5a5" };
      case "medium":
        return { backgroundColor: "#fef3c7", color: "var(--severity-warning)", border: "1px solid #fcd34d" };
      case "low":
      default:
        return { backgroundColor: "#d1fae5", color: "var(--severity-safe)", border: "1px solid #6ee7b7" };
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "escalated":
        return { color: "var(--severity-risk)", fontWeight: 700 };
      case "dispatched":
        return { color: "var(--accent-primary)", fontWeight: 700 };
      case "monitoring":
        return { color: "var(--text-secondary)", fontWeight: 600 };
      case "active":
      default:
        return { color: "#d97706", fontWeight: 700 };
    }
  };

  // Filtering Logic
  const filteredEvents = events.filter((evt) => {
    const matchesSearch = 
      evt.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.corridor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "all" || evt.severity.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesPriority;
  });

  // Sorting Logic
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Incident Dispatch Log</h3>
        
        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Priority Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaFilter style={{ fontSize: "11px", color: "var(--text-secondary)" }} />
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                backgroundColor: "white",
                color: "var(--text-primary)",
                outline: "none"
              }}
            >
              <option value="all">All Priorities</option>
              <option value="high">High Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>
          </div>

          {/* Search bar */}
          <div style={{ position: "relative" }}>
            <FaSearch style={{ position: "absolute", left: "10px", top: "9px", fontSize: "11px", color: "var(--text-secondary)" }} />
            <input 
              type="text" 
              placeholder="Search corridor/event..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "6px 10px 6px 28px",
                fontSize: "12px",
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                width: "180px",
                outline: "none"
              }}
            />
          </div>
        </div>
      </div>

      {/* Responsive Table wrapper */}
      <div style={{ overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
              {["event_type", "corridor", "severity", "status", "duration"].map((field) => {
                const label = field.replace("_", " ").toUpperCase();
                const isCurrent = sortField === field;
                return (
                  <th 
                    key={field} 
                    onClick={() => handleSort(field)}
                    style={{
                      padding: "10px 16px",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      fontSize: "11px",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {label}
                      {isCurrent && (sortDirection === "asc" ? <FaArrowUp style={{ fontSize: "8px" }} /> : <FaArrowDown style={{ fontSize: "8px" }} />)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedEvents.length > 0 ? (
              sortedEvents.map((evt) => (
                <tr key={evt.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{evt.event_type}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 500 }}>{evt.corridor}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: "3px",
                      display: "inline-block",
                      ...getPriorityColor(evt.severity)
                    }}>
                      {evt.severity}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", ...getStatusStyle(evt.status) }}>
                    {evt.status}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600 }}>{evt.duration}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)" }}>
                  No active traffic incidents match your search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LiveEventsTable;
