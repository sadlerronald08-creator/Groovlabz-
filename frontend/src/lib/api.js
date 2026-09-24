import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export { BACKEND_URL };
export const API = `${BACKEND_URL}/api`;
export const mediaUrl = (u) => (u && u.startsWith("/api/") ? `${BACKEND_URL}${u}` : u);

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gl_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
