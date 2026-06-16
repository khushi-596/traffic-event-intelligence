import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MapView from "../components/MapView";
import ForecastPanel from "../components/ForecastPanel";
import PerformanceChart from "../components/PerformanceChart";
import RiskHeatmap from "../components/RiskHeatmap";
import SystemStatus from "../components/SystemStatus";
import BeforeAfterComparison from "../components/BeforeAfterComparison";
import LiveEventsTable from "../components/LiveEventsTable";
import NotificationPanel from "../components/NotificationPanel";
import Sidebar from "../components/Sidebar";
import EventDetailsModal from "../components/EventDetailsModal";
import HeatmapDetailsModal from "../components/HeatmapDetailsModal";

function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner Status Overview */}
      <SystemStatus />

      <div className="dashboard-grid">
        {/* Left Monitoring Column */}
        <div className="left-column">
          <div id="map" style={{ scrollMarginTop: "20px" }}>
            <MapView onMarkerClick={(evt) => setSelectedEvent(evt)} />
          </div>
          <div id="events-table">
            <LiveEventsTable />
          </div>
          <div id="heatmap" style={{ scrollMarginTop: "20px" }}>
            <RiskHeatmap onCellClick={(cell) => setSelectedCell(cell)} />
          </div>
        </div>
        
        {/* Right Dispatch & Performance Panel */}
        <div className="right-column">
          <Sidebar />
          <div id="forecast" style={{ scrollMarginTop: "20px" }}>
            <ForecastPanel />
          </div>
          <BeforeAfterComparison />
          <NotificationPanel />
          <div id="insights" style={{ scrollMarginTop: "20px" }}>
            <PerformanceChart />
          </div>
        </div>
      </div>

      {/* Dispatch Overlays */}
      <EventDetailsModal 
        isOpen={selectedEvent !== null} 
        onClose={() => setSelectedEvent(null)} 
        event={selectedEvent} 
      />
      
      <HeatmapDetailsModal 
        isOpen={selectedCell !== null} 
        onClose={() => setSelectedCell(null)} 
        cell={selectedCell} 
      />
    </div>
  );
}

export default Dashboard;