import { Link } from "react-router-dom";
import { FaRoute, FaMap, FaChartLine, FaCalendarAlt, FaArrowRight } from "react-icons/fa";

function Home() {
  const features = [
    {
      title: "Traffic Impact Assessment",
      desc: "Analyze route congestion predictions, estimated travel delays, and automated officer deployment recommendations.",
      icon: <FaRoute className="home-card-icon forecast-color" />,
      hash: "forecast",
    },
    {
      title: "Live Incident Monitoring",
      desc: "Track active street incidents, accidents, waterlogging, and road construction hotspots on a live interactive map.",
      icon: <FaMap className="home-card-icon map-color" />,
      hash: "map",
    },
    {
      title: "Operational Analytics",
      desc: "Evaluate hourly congestion trends, key performance metrics, and resource utilization across major corridors.",
      icon: <FaChartLine className="home-card-icon chart-color" />,
      hash: "insights",
    },
    {
      title: "Corridor Risk Calendar",
      desc: "Schedule traffic interventions proactively using 7-day risk calendars and corridor event forecasts.",
      icon: <FaCalendarAlt className="home-card-icon risk-color" />,
      hash: "heatmap",
    },
  ];

  return (
    <div className="home-wrapper">
      <main className="home-container">
        {/* Hero Section */}
        <section className="home-hero">
          <h1 className="hero-title">Traffic Event Intelligence Platform</h1>
          <p className="hero-tagline">
            Real-time monitoring, congestion forecasting, and operational planning for Bengaluru traffic management.
          </p>
          <p className="hero-desc">
            Analyze traffic events, identify corridor risks, forecast congestion impact, and support data-driven deployment of traffic management resources.
          </p>
          
          <Link to="/dashboard" id="btn-enter-dashboard" className="btn-predict btn-hero-cta">
            Launch Command Center <FaArrowRight />
          </Link>
        </section>

        {/* Feature Grid */}
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
      </main>
    </div>
  );
}

export default Home;

