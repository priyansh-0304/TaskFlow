import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const client = axios.create({ baseURL: `${API_BASE}/api` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const auth = {
  signup: (data) => client.post("/auth/signup", data),
  login: (data) => client.post("/auth/login", data),
  me: () => client.get("/auth/me"),
};

export const projects = {
  list: () => client.get("/projects"),
  get: (id) => client.get(`/projects/${id}`),
  create: (data) => client.post("/projects", data),
  update: (id, data) => client.put(`/projects/${id}`, data),
  delete: (id) => client.delete(`/projects/${id}`),
  addMember: (id, data) => client.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => client.delete(`/projects/${id}/members/${userId}`),
};

export const tasks = {
  dashboard: () => client.get("/tasks/dashboard"),
  my: () => client.get("/tasks/my"),
  create: (data) => client.post("/tasks", data),
  update: (id, data) => client.put(`/tasks/${id}`, data),
  delete: (id) => client.delete(`/tasks/${id}`),
};