import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FaChartLine, FaCheckDouble, FaBug, FaArrowTrendUp } from "react-icons/fa6";

const mockPerformanceData = [
  { time: "06:00", CongestionIndex: 20, PredictionAccuracy: 91 },
  { time: "08:00", CongestionIndex: 75, PredictionAccuracy: 93 },
  { time: "10:00", CongestionIndex: 90, PredictionAccuracy: 95 },
  { time: "12:00", CongestionIndex: 60, PredictionAccuracy: 94 },
  { time: "14:00", CongestionIndex: 50, PredictionAccuracy: 93 },
  { time: "16:00", CongestionIndex: 80, PredictionAccuracy: 94 },
  { time: "18:00", CongestionIndex: 95, PredictionAccuracy: 95 },
  { time: "20:00", CongestionIndex: 70, PredictionAccuracy: 96 },
  { time: "22:00", CongestionIndex: 40, PredictionAccuracy: 96 },
];

function PerformanceChart() {
  const modelStats = [
    { 
      label: "Prediction Accuracy", 
      value: "94.2%", 
      sub: "+1.8% vs last week", 
      icon: <FaCheckDouble />, 
      color: "var(--severity-safe)", 
      bgColor: "#ecfdf5",
      borderColor: "#d1fae5"
    },
    { 
      label: "Average Error (MAPE)", 
      value: "5.8%", 
      sub: "-0.6% improvement", 
      icon: <FaBug />, 
      color: "var(--severity-risk)", 
      bgColor: "#fef2f2",
      borderColor: "#fee2e2"
    },
    { 
      label: "Learning Improvement", 
      value: "+12.4%", 
      sub: "Active reinforcement", 
      icon: <FaArrowTrendUp />, 
      color: "var(--severity-info)", 
      bgColor: "#eff6ff",
      borderColor: "#d1e9ff"
    }
  ];

  return (
    <div className="chart-card glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="chart-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <FaChartLine style={{ color: "var(--accent-primary)" }} />
          Model Performance Analytics
        </h3>
      </div>
      
      {/* KPI Cards */}
      <div className="metrics-container" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {modelStats.map((stat, idx) => (
          <div key={idx} className="metric-card" style={{
            padding: "12px 16px",
            backgroundColor: stat.bgColor,
            border: `1px solid ${stat.borderColor}`,
            borderRadius: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase" }}>{stat.label}</span>
              <span style={{ color: stat.color, fontSize: "12px" }}>{stat.icon}</span>
            </div>
            <h4 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{stat.value}</h4>
            <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: 600 }}>{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Accuracy and Congestion Trend Chart */}
      <div style={{ width: "100%", height: 220, marginTop: "6px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="var(--text-secondary)" 
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                background: "#ffffff", 
                border: "1px solid var(--border-color)",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 700 }}
              itemStyle={{ fontSize: "12px", fontWeight: 600 }}
            />
            <Area 
              type="monotone" 
              dataKey="CongestionIndex" 
              name="Congestion Level"
              stroke="#2563eb" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorCongestion)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PerformanceChart;
