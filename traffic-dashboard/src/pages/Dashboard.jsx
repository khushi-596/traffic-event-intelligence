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
import { 
  getEvents, 
  getRiskCalendar, 
  getFeedbackMetrics, 
  getEvaluationClassification, 
  getEvaluationRegression 
} from "../services/api";

function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  const [riskCalendar, setRiskCalendar] = useState(null);
  const [riskLoading, setRiskLoading] = useState(true);
  const [riskError, setRiskError] = useState(null);

  const [feedbackMetrics, setFeedbackMetrics] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState(null);

  const [evaluation, setEvaluation] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(true);
  const [evaluationError, setEvaluationError] = useState(null);

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

  useEffect(() => {
    const loadDashboardData = async () => {
      setEventsLoading(true);
      setRiskLoading(true);
      setFeedbackLoading(true);
      setEvaluationLoading(true);

      const eventsPromise = getEvents()
        .then((res) => {
          setEvents(res.data);
          setEventsLoading(false);
        })
        .catch((err) => {
          console.error("Error loading events:", err);
          setEventsError("Failed to load traffic events. Backend may be offline.");
          setEventsLoading(false);
        });

      const riskPromise = getRiskCalendar()
        .then((res) => {
          setRiskCalendar(res.data);
          setRiskLoading(false);
        })
        .catch((err) => {
          console.error("Error loading risk calendar:", err);
          setRiskError("Failed to load risk calendar. Backend may be offline.");
          setRiskLoading(false);
        });

      const feedbackPromise = getFeedbackMetrics()
        .then((res) => {
          setFeedbackMetrics(res.data);
          setFeedbackLoading(false);
        })
        .catch((err) => {
          console.error("Error loading feedback metrics:", err);
          setFeedbackError("Failed to load feedback metrics. Backend may be offline.");
          setFeedbackLoading(false);
        });

      const evaluationPromise = Promise.all([
        getEvaluationClassification(),
        getEvaluationRegression()
      ])
        .then(([classRes, regRes]) => {
          setEvaluation({
            classification: classRes.data,
            regression: regRes.data
          });
          setEvaluationLoading(false);
        })
        .catch((err) => {
          console.error("Error loading evaluation metrics:", err);
          setEvaluationError("Failed to load evaluation metrics. Backend may be offline.");
          setEvaluationLoading(false);
        });

      await Promise.all([eventsPromise, riskPromise, feedbackPromise, evaluationPromise]);
    };

    loadDashboardData();
  }, []);

  const refreshFeedback = () => {
    getFeedbackMetrics()
      .then((res) => setFeedbackMetrics(res.data))
      .catch((err) => console.error("Error refreshing feedback:", err));
    getEvents()
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("Error refreshing events:", err));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner Status Overview */}
      <SystemStatus />

      <div className="dashboard-grid">
        {/* Left Monitoring Column */}
        <div className="left-column">
          <div id="map" style={{ scrollMarginTop: "20px" }}>
            <MapView 
              onMarkerClick={(evt) => setSelectedEvent(evt)} 
              events={events}
              loading={eventsLoading}
              error={eventsError}
            />
          </div>
          <div id="events-table">
            <LiveEventsTable 
              events={events}
              loading={eventsLoading}
              error={eventsError}
            />
          </div>
          <div id="heatmap" style={{ scrollMarginTop: "20px" }}>
            <RiskHeatmap 
              onCellClick={(cell) => setSelectedCell(cell)} 
              riskCalendar={riskCalendar}
              loading={riskLoading}
              error={riskError}
            />
          </div>
        </div>
        
        {/* Right Dispatch & Performance Panel */}
        <div className="right-column">
          <Sidebar 
            events={events}
            loading={eventsLoading}
            onRetrainSuccess={refreshFeedback}
          />
          <div id="forecast" style={{ scrollMarginTop: "20px" }}>
            <ForecastPanel />
          </div>
          <BeforeAfterComparison 
            feedbackMetrics={feedbackMetrics}
            loading={feedbackLoading}
            error={feedbackError}
          />
          <NotificationPanel />
          <div id="insights" style={{ scrollMarginTop: "20px" }}>
            <PerformanceChart 
              feedbackMetrics={feedbackMetrics}
              evaluation={evaluation}
              loading={evaluationLoading || feedbackLoading}
              error={evaluationError || feedbackError}
            />
          </div>
        </div>
      </div>

      {/* Dispatch Overlays */}
      <EventDetailsModal 
        isOpen={selectedEvent !== null} 
        onClose={() => setSelectedEvent(null)} 
        event={selectedEvent} 
        onFeedbackSubmit={refreshFeedback}
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