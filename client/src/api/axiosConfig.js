// axiosConfig.js
import axios from "axios";
import { tokenManager } from "../utils/tokenManager";

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Important for refresh token cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process failed requests queue
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - Add access token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();

    // Add token to request if available and not a refresh token request
    if (token && !config.url?.includes("/auth/refresh-token")) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If this is a refresh token request that failed, logout user
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        console.log("❌ Refresh token failed - session expired");
        tokenManager.clearTokens();
        // Redirect to login or dispatch logout action
        console.log("ye wala log");

        window.location.href = "/login";
        return Promise.reject(error);
      }

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark as retrying to prevent infinite loops
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("🔄 Access token expired, attempting refresh...");

        // Attempt to refresh token
        const refreshResponse = await axiosInstance.post("/auth/refresh-token");

        const { accessToken } = refreshResponse.data.data;

        if (accessToken) {
          // Store new access token
          tokenManager.setAccessToken(accessToken);

          // Update the authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests
          processQueue(null, accessToken);

          console.log("✅ Token refreshed successfully");

          // Retry the original request
          return axiosInstance(originalRequest);
        } else {
          throw new Error("No access token received");
        }
      } catch (refreshError) {
        console.log("❌ Token refresh failed:", refreshError.message);

        // Clear tokens and redirect to login
        tokenManager.clearTokens();
        processQueue(refreshError, null);

        // Redirect to login page
        // window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log other errors in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}:`,
        error.response?.data?.message || error.message
      );
    }
    return Promise.reject(error);
  }
);

// Helper function to handle logout
export const handleLogout = async () => {
  try {
    // Call logout endpoint to clean up server-side
    await axiosInstance.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear tokens regardless of server response
    tokenManager.clearTokens();
    // window.location.href = "/login";
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!tokenManager.getAccessToken();
};

const api = axiosInstance;
// Export configured axios instance
export { api };
