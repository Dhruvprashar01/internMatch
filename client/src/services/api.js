import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT on every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 handler — NEVER redirect on auth pages
const AUTH_PATHS = ["/login", "/register"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Normalize error message for UI
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    // Only redirect on 401 if NOT on an auth page
    // This was causing the login page to remount and destroy the error toast
    if (error.response?.status === 401) {
      const onAuthPage = AUTH_PATHS.some((p) =>
        window.location.pathname.startsWith(p)
      );
      if (!onAuthPage) {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;