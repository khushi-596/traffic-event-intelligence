import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  timeout: 8000,
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err.message);
    return Promise.reject(err);
  }
);

export const getHealth = () => API.get("/health");
export const getEvents = (limit) => API.get("/events" + (limit ? `?limit=${limit}` : ""));
export const getRiskCalendar = (params) => API.get("/risk-calendar", { params });
export const getFeedbackMetrics = () => API.get("/feedback/metrics");
export const getEvaluation = () => API.get("/evaluation");
export const getEvaluationClassification = () => API.get("/evaluation/classification");
export const getEvaluationRegression = () => API.get("/evaluation/regression");
export const postForecast = (payload) => API.post("/forecast", payload);
export const postRecommendations = (payload) => API.post("/recommendations", payload);
export const postFeedback = (payload) => API.post("/feedback", payload);
export const postRetrain = () => API.post("/feedback/retrain");

export default API;