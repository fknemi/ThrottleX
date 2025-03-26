import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// Add request interceptor for auth token if needed
api.interceptors.request.use(async (config) => {
  // You can add auth tokens here if needed
  return config;
});

export default api;
