import { Link } from "react-router-dom";
import { 
  FaRoute, 
  FaMap, 
  FaChartLine, 
  FaCalendarAlt, 
  FaArrowRight, 
  FaDatabase, 
  FaCheckCircle, 
  FaRoad,
  FaFileAlt
} from "react-icons/fa";

function Home() {
  const stats = [
    { value: "8,173", label: "Historical Events", icon: <FaDatabase /> },
    { value: "5,030", label: "High Priority Events", icon: <FaCheckCircle /> },
    { value: "7,706", label: "Unplanned Events", icon: <FaFileAlt /> },
    { value: "18", label: "Major Traffic Corridors", icon: <FaRoad /> }
  ];

  const features = [
    {
      title: "Event Impact Forecasting",
      desc: "Analyze congestion predictions, estimated delays, and traffic impact assessments.",
      icon: <FaRoute className="home-card-icon forecast-color" />,
      hash: "forecast",
    },
    {
      title: "Live Incident Monitoring",
      desc: "Track active incidents, breakdowns, construction zones, and waterlogging hotspots.",
      icon: <FaMap className="home-card-icon map-color" />,
      hash: "map",
    },
    {
      title: "Traffic Operations Analytics",
      desc: "Review corridor performance, congestion trends, and operational metrics.",
      icon: <FaChartLine className="home-card-icon chart-color" />,
      hash: "insights",
    },
    {
      title: "Corridor Risk Calendar",
      desc: "Identify recurring traffic risks and plan interventions proactively.",
      icon: <FaCalendarAlt className="home-card-icon risk-color" />,
      hash: "heatmap",
    },
  ];

  const steps = [
    { num: "01", title: "Detect Events", desc: "Capture incidents from traffic-event logs" },
    { num: "02", title: "Build Risk Calendar", desc: "Identify recurring corridor and time-based patterns" },
    { num: "03", title: "Predict Severity", desc: "Estimate event impact and priority levels" },
    { num: "04", title: "Estimate Duration", desc: "Forecast expected clearance times" },
    { num: "05", title: "Recommend Resources", desc: "Suggest manpower deployment and diversion plans" },
    { num: "06", title: "Learn From Outcomes", desc: "Improve future predictions using historical outcomes" }
  ];

  const previews = [
    {
      title: "Live Incident Monitoring",
      tag: "Active Monitoring",
      details: [
        { label: "Active Incidents", value: "12 Events" },
        { label: "Critical Hotspots", value: "3 Corridors" },
        { label: "Map Layer Status", value: "Online (ASTRAM)" }
      ]
    },
    {
      title: "Event Forecast Engine",
      tag: "Predictive Analytics",
      details: [
        { label: "Forecast Accuracy", value: "95.2% (MAPE)" },
        { label: "Avg Delay Forecast", value: "+18.4 mins" },
        { label: "High Risk Suggestion", value: "Manpower Dispatch active" }
      ]
    },
    {
      title: "Corridor Risk Calendar",
      tag: "Proactive Planning",
      details: [
        { label: "Active Calendar", value: "7-Day Matrix" },
        { label: "High Risk Time Window", value: "17:00 - 19:30" },
        { label: "Audited Corridors", value: "18 Outwards" }
      ]
    },
    {
      title: "Resource Recommendation Engine",
      tag: "Operational Dispatch",
      details: [
        { label: "Manpower Optimized", value: "42 Officers" },
        { label: "Alternate Route Suggestions", value: "Dynamic Diversion Active" },
        { label: "Clearance Rate Improvement", value: "+14.6% efficiency" }
      ]
    }
  ];

  return (
    <div className="home-wrapper">
      <main className="home-container">
        {/* Section 1: Hero Banner */}
        <section className="home-hero">
          <h1 className="hero-title">Gridlock Bengaluru Traffic Command Center</h1>
          <p className="hero-tagline">
            Real-time monitoring, congestion forecasting, and operational planning for Bengaluru traffic management.
          </p>
          <p className="hero-desc">
            Designed to help traffic authorities forecast congestion, optimize manpower deployment, recommend diversion routes, and continuously learn from historical traffic events.
          </p>
          
          <Link to="/dashboard" id="btn-enter-dashboard" className="btn-predict btn-hero-cta">
            Open Operations Dashboard <FaArrowRight />
          </Link>
        </section>

        {/* Section 2: Traffic Dataset Overview (Statistics Strip) */}
        <section className="stats-strip-section">
          <div className="stats-strip">
            {stats.map((stat, i) => (
              <div key={i} className={`stats-card ${i === 1 || i === 2 ? "stat-card-warm" : ""}`}>
                <div className="stats-card-header">
                  <span className="stats-icon">{stat.icon}</span>
                  <span className="stats-value">{stat.value}</span>
                </div>
                <p className="stats-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Explore System Capabilities */}
        <section className="home-features-section">
          <h2 className="section-title">Explore System Capabilities</h2>
          <div className="home-grid">
            {features.map((feature, i) => (
              <Link 
                to={`/dashboard#${feature.hash}`} 
                key={i} 
                className="home-card"
                id={`card-${feature.hash}`}
              >
                <div className="home-card-header">
                  {feature.icon}
                  <h3>{feature.title}</h3>
                </div>
                <p className="home-card-desc">{feature.desc}</p>
                <div className="home-card-footer">
                  <span>Explore Feature</span>
                  <FaArrowRight className="arrow-hover" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 4: How Gridlock Works */}
        <section className="works-section">
          <h2 className="section-title">How Gridlock Works</h2>
          <p className="section-subtitle">Transforming historical traffic events into operational decisions.</p>
          <div className="works-timeline">
            {steps.map((step, i) => (
              <div key={i} className="timeline-step">
                <div className={`step-number-badge ${i % 2 === 1 ? "step-badge-warm" : ""}`}>{step.num}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Why Gridlock? (Problem Statement) */}
        <section className="why-section">
          <div className="problem-panel">
            <h3 className="problem-title">Why Gridlock?</h3>
            <div className="problem-content">
              <p>
                Traffic events such as vehicle breakdowns, accidents, processions, construction activities, waterlogging, and VIP movements frequently disrupt urban mobility.
              </p>
              <p>
                Gridlock transforms historical event data into actionable intelligence by forecasting event severity, estimating clearance times, identifying corridor risks, and recommending operational responses. This enables traffic authorities to make faster and more informed decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: Operations Dashboard Preview */}
        <section className="preview-section">
          <h2 className="section-title">Operations Dashboard Preview</h2>
          <p className="section-subtitle">Real-time preview indicators from active dashboard modules.</p>
          <div className="preview-grid">
            {previews.map((preview, i) => (
              <div key={i} className="preview-card">
                <div className="preview-card-header">
                  <span className="preview-tag">{preview.tag}</span>
                  <h4>{preview.title}</h4>
                </div>
                <div className="preview-card-body">
                  {preview.details.map((detail, idx) => (
                    <div key={idx} className="preview-detail-row">
                      <span className="preview-detail-label">{detail.label}</span>
                      <span className="preview-detail-val">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;

