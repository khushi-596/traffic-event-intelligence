import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 8000,
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err.message);
    return Promise.reject(err);
  }
);

export default API;