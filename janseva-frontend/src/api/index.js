import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────
export const login    = (data) => API.post("/auth/login", data);
export const register = (data) => API.post("/auth/register", data);
export const getMe    = ()     => API.get("/auth/me");

// ─── Reports ─────────────────────────────────────
export const getReports    = (params) => API.get("/reports", { params });
export const getReportById = (id)     => API.get(`/reports/${id}`);
export const createReport  = (data)   => API.post("/reports", data);
export const voteReport    = (id)     => API.patch(`/reports/${id}/vote`);
export const updateStatus  = (id, data) => API.patch(`/reports/${id}/status`, data);
export const addComment    = (id, data) => API.post(`/reports/${id}/comments`, data);

// ─── Trending ─────────────────────────────────────
export const getTrending = (params) => API.get("/trending", { params });

// ─── Map ──────────────────────────────────────────
export const getMarkers = () => API.get("/map/markers");

// ─── Gov (officer only) ───────────────────────────
export const getGovStats      = ()       => API.get("/gov/stats");
export const getPriorityQueue = (params) => API.get("/gov/priority", { params });
export const getDeptQueue     = (params) => API.get("/gov/department", { params });
export const postGovResponse  = (id, data) => API.post(`/gov/${id}/response`, data);

export default API;