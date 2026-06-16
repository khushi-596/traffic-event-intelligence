import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import API from "../services/api";
import { mockEvents } from "../services/mockEvents";

const USE_MOCK = true; // Set to false to swap for a live /events API call later

// Bengaluru center coordinates
const BENGALURU_CENTER = [12.9716, 77.5946];

function MapView({ onMarkerClick }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        if (USE_MOCK) {
          // Simulate network latency
          await new Promise((resolve) => setTimeout(resolve, 800));
          setEvents(mockEvents);
        } else {
          const response = await API.get("/events");
          setEvents(response.data);
        }
      } catch (err) {
        console.error("Error fetching traffic events:", err);
        setError("Failed to load traffic events. Backend may be offline.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "#EF4444"; // Red
      case "medium":
        return "#F59E0B"; // Orange
      case "low":
        return "#10B981"; // Emerald Green
      default:
        return "#6B7280"; // Gray
    }
  };

  const createCustomIcon = (severity) => {
    const color = getSeverityColor(severity);
    return L.divIcon({
      html: `<div class="custom-marker" style="--marker-color: ${color}">
               <div class="marker-pulse"></div>
               <div class="marker-core"></div>
             </div>`,
      className: "custom-div-icon",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9],
    });
  };

  const highRiskCount = events.filter((e) => e.severity?.toLowerCase() === "high").length;

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
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Active Alerts: </span>
            <strong style={{ color: "var(--accent-primary)" }}>{events.length} Active</strong>
          </div>
          <div style={{ fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>High Risk Events: </span>
            <strong style={{ color: "var(--severity-risk)" }}>{highRiskCount} Critical</strong>
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

        <MapContainer
          center={BENGALURU_CENTER}
          zoom={12}
          style={{ width: "100%", height: "100%", borderRadius: "6px", zIndex: 1 }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {events.map((event) => (
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
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
