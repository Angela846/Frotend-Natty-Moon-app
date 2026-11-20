import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ESENCIAL: permite que el navegador envie/reciba la cookie httpOnly del JWT
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
