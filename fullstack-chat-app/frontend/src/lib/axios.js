import axios from "axios";

const BASE_URL = import.meta.env.MODE === "development" ? "http://127.0.0.1:5001/api" : "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // Important for sending cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to log cookies and headers
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Request cookies:', document.cookie);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor with more detailed logging
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    if (error.response?.status === 401) {
      console.log("Unauthorized - redirecting to login");
      // Optionally redirect to login here
    }
    return Promise.reject(error);
  }
);
