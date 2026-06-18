import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Bengaluru center coordinates
const BENGALURU_CENTER = [12.9716, 77.5946];

// Major corridors data
const CORRIDORS = [
  {
    name: "Mysore Road",
    coords: [
      [12.965, 77.575],
      [12.95, 77.55],
      [12.93, 77.52],
      [12.91, 77.48]
    ]
  },
  {
    name: "Outer Ring Road",
    coords: [
      [12.9176, 77.6244],
      [12.93, 77.68],
      [12.97, 77.69],
      [13.01, 77.67],
      [13.03, 77.64],
      [13.0360, 77.5975]
    ]
  },
  {
    name: "Bellary Road",
    coords: [
      [12.99, 77.59],
      [13.02, 77.59],
      [13.0360, 77.5975],
      [13.06, 77.60],
      [13.08, 77.61]
    ]
  },
  {
    name: "Hosur Road",
    coords: [
      [12.96, 77.61],
      [12.94, 77.62],
      [12.9176, 77.6244],
      [12.89, 77.64],
      [12.86, 77.66]
    ]
  }
];

// Important junctions
const JUNCTIONS = [
  { name: "Silk Board Junction", coords: [12.9176, 77.6244] },
  { name: "Majestic Junction", coords: [12.9778, 77.5724] },
  { name: "Hebbal Flyover", coords: [13.0360, 77.5975] },
  { name: "Dairy Circle", coords: [12.9427, 77.6047] },
  { name: "Tin Factory", coords: [13.0040, 77.6616] }
];

// High risk zones
const RISK_ZONES = [
  { name: "Silk Board Congestion Zone", coords: [12.9176, 77.6244], radius: 450, color: "#dc2626" },
  { name: "Hebbal Traffic Choke Point", coords: [13.0360, 77.5975], radius: 500, color: "#dc2626" },
  { name: "Majestic Terminal Jam Area", coords: [12.9778, 77.5724], radius: 500, color: "#f97316" }
];

// Heatmap points for risk calendar preview
const HEATMAP_POINTS = [
  { coords: [12.9176, 77.6244], radius: 1500, color: "#ef4444" }, // Silk Board (Critical)
  { coords: [12.9778, 77.5724], radius: 1500, color: "#ef4444" }, // Majestic (Critical)
  { coords: [12.9348, 77.6189], radius: 1200, color: "#f97316" }, // Koramangala (High)
  { coords: [12.9719, 77.6412], radius: 1200, color: "#f97316" }, // Indiranagar (High)
  { coords: [12.956, 77.595], radius: 1000, color: "#eab308" },  // Richmond Road (Medium)
  { coords: [13.0360, 77.5975], radius: 1400, color: "#eab308" }, // Hebbal (Medium)
  { coords: [12.92, 77.54], radius: 1100, color: "#10b981" },    // Banashankari (Low)
  { coords: [12.99, 77.66], radius: 1300, color: "#10b981" }     // K R Puram (Low)
];

function MapView({ onMarkerClick, events = [], loading = false, error = null }) {
  // Map layer toggles
  const [showMarkers, setShowMarkers] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  const durationBySeverity = {
    critical: "180-360 mins",
    high: "90-180 mins",
    medium: "45-90 mins",
    low: "15-45 mins"
  };

  const manpowerBySeverity = {
    low: "2 Officers",
    medium: "4 Officers",
    high: "8 Officers",
    critical: "12 Officers"
  };

  // Adapter mapping from backend EventResponse schema to frontend expectations
  const mappedEvents = events.map((e) => {
    // Map event_cause strings to friendly display values
    const causeDisplay = e.event_cause
      ? e.event_cause.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : e.event_type;

    return {
      id: e.id,
      event_type: causeDisplay || "Traffic Incident",
      corridor: e.corridor || "Unknown Corridor",
      lat: e.latitude,
      lng: e.longitude,
      status: e.status, // preserve status for active calculation
      severity: e.priority || "Low",
      predicted_duration: e.duration_minutes != null ? `${Math.round(e.duration_minutes)} mins` : (durationBySeverity[e.priority?.toLowerCase()] || "Unknown"),
      manpower_recommended: e.manpower_band ? `${e.manpower_band} Band` : (manpowerBySeverity[e.priority?.toLowerCase()] || "2 Officers"),
      suggested_diversion: e.suggested_diversion || "No diversion recommended"
    };
  });

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "#7f1d1d"; // Dark Red
      case "high":
        return "#dc2626"; // Red
      case "medium":
        return "#f59e0b"; // Amber
      case "low":
        return "#10b981"; // Green
      default:
        return "#6b7280"; // Gray
    }
  };

  const createCustomIcon = (severity) => {
    const color = getSeverityColor(severity);
    const isCritical = severity?.toLowerCase() === "critical";
    return L.divIcon({
      html: `<div class="custom-marker" style="--marker-color: ${color}">
               ${isCritical ? '<div class="marker-pulse"></div>' : ""}
               <div class="marker-core"></div>
             </div>`,
      className: "custom-div-icon",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9],
    });
  };

  const highRiskCount = mappedEvents.filter((e) =>
    ["high", "critical"].includes(e.severity?.toLowerCase())
  ).length;

  // Active Alerts count only non-closed events. Total Events count everything loaded.
  const activeCount = mappedEvents.filter(
    (e) => e.status?.toLowerCase() !== "closed"
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Event stats above map */}
      <div className="glass-panel" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        backgroundColor: "var(--bg-secondary)"
      }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <div style={{ fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Total Events: </span>
            <strong style={{ color: "var(--text-primary)" }}>{mappedEvents.length} Loaded</strong>
          </div>
          <div style={{ fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Active Alerts: </span>
            <strong style={{ color: "var(--accent-primary)" }}>{activeCount} Active</strong>
          </div>
          <div style={{ fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>High/Critical Risk: </span>
            <strong style={{ color: "var(--severity-risk)" }}>{highRiskCount} Active</strong>
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>
          GIS FEED: <strong style={{ color: "var(--severity-safe)" }}>SYNCHRONIZED</strong>
        </div>
      </div>

      <div className="map-container">
        {loading && (
          <div className="map-loader">
            <div className="spinner"></div>
            <span>Loading traffic events...</span>
          </div>
        )}

        {error && (
          <div className="map-error-toast">
            <span>{error}</span>
          </div>
        )}

        {/* Map Control Panel (Top Right Corner) */}
        <div className="map-layer-control-panel">
          <div className="control-panel-title">Layer Control</div>
          <label className="control-panel-item">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
            />
            <span>Incident Markers</span>
          </label>
          <label className="control-panel-item">
            <input
              type="checkbox"
              checked={showRiskZones}
              onChange={(e) => setShowRiskZones(e.target.checked)}
            />
            <span>Risk Zones</span>
          </label>
          <label className="control-panel-item">
            <input
              type="checkbox"
              checked={showCorridors}
              onChange={(e) => setShowCorridors(e.target.checked)}
            />
            <span>Traffic Corridors</span>
          </label>
          <label className="control-panel-item">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
            />
            <span>Heatmap Overlay</span>
          </label>
        </div>

        <MapContainer
          center={BENGALURU_CENTER}
          zoom={12}
          style={{ width: "100%", height: "100%", borderRadius: "6px", zIndex: 1 }}
          zoomControl={true}
        >
          {/* Light Professional basemap */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Heatmap Overlay Layer */}
          {showHeatmap && HEATMAP_POINTS.map((point, idx) => (
            <Circle
              key={`heat-${idx}`}
              center={point.coords}
              radius={point.radius}
              pathOptions={{
                stroke: false,
                fillColor: point.color,
                fillOpacity: 0.22,
              }}
            />
          ))}

          {/* High-Risk Zones Layer */}
          {showRiskZones && RISK_ZONES.map((zone, idx) => (
            <Circle
              key={`zone-${idx}`}
              center={zone.coords}
              radius={zone.radius}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: "4 4",
              }}
            >
              <Tooltip permanent direction="bottom" className="custom-tooltip-label">
                <div style={{ fontWeight: 700, fontSize: "9px", color: zone.color, textTransform: "uppercase" }}>
                  ⚠️ {zone.name}
                </div>
              </Tooltip>
            </Circle>
          ))}

          {/* Traffic Corridors Layer */}
          {showCorridors && CORRIDORS.map((corridor, idx) => (
            <Polyline
              key={`corr-${idx}`}
              positions={corridor.coords}
              pathOptions={{
                color: "#2563eb",
                weight: 4,
                opacity: 0.5,
              }}
            >
              <Tooltip permanent direction="center" className="custom-tooltip-label">
                <span style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "9px", textTransform: "uppercase" }}>
                  🛣️ {corridor.name}
                </span>
              </Tooltip>
            </Polyline>
          ))}

          {/* Important Junctions Layer */}
          {showCorridors && JUNCTIONS.map((junction, idx) => (
            <CircleMarker
              key={`junc-${idx}`}
              center={junction.coords}
              radius={4.5}
              pathOptions={{
                fillColor: "#475569",
                color: "#ffffff",
                weight: 1.5,
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -4]} className="custom-tooltip-label">
                <div style={{ fontWeight: 700, fontSize: "9px", color: "#334155", textTransform: "uppercase" }}>
                  📍 {junction.name}
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

          {/* Incident Markers Layer */}
          {showMarkers && mappedEvents.map((event) => (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createCustomIcon(event.severity)}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(event);
                  }
                }
              }}
            >
              {/* Styled Leaflet Popup */}
              <Popup>
                <div className="popup-container">
                  <div className="popup-header">
                    <span className="popup-title">{event.event_type}</span>
                    <span className={`popup-priority-badge ${event.severity.toLowerCase()}`}>
                      {event.severity}
                    </span>
                  </div>
                  <div className="popup-body">
                    <div className="popup-field">
                      <div className="field-label">Corridor</div>
                      <div className="field-value font-highlight">{event.corridor}</div>
                    </div>
                    <div className="popup-field-row">
                      <div className="popup-field">
                        <div className="field-label">Predicted Duration</div>
                        <div className="field-value font-highlight">{event.predicted_duration || "N/A"}</div>
                      </div>
                      <div className="popup-field">
                        <div className="field-label">Recommended Manpower</div>
                        <div className="field-value font-highlight">{event.manpower_recommended || "N/A"}</div>
                      </div>
                    </div>
                    <div className="popup-field">
                      <div className="field-label">Suggested Diversion</div>
                      <div className="diversion-highlight">{event.suggested_diversion || "No diversion recommended"}</div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
