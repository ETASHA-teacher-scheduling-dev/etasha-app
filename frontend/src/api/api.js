import axios from "axios";
import authService from "./authService";

const instance = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor (adds the token)
instance.interceptors.request.use(
  (config) => {
    const user = authService.getCurrentUser();
    if (user && user.accessToken) {
      config.headers["x-access-token"] = user.accessToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- NEW: Response Interceptor (handles auth errors) ---
instance.interceptors.response.use(
  (res) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return res;
  },
  (err) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const originalConfig = err.config;

    if (originalConfig.url !== "/auth/signin" && err.response) {
      // Access Token was expired or invalid
      if ((err.response.status === 401 || err.response.status === 403) && !originalConfig._retry) {
        originalConfig._retry = true;

        console.log("Authentication error detected. Logging out.");
        authService.logout();
        window.location = '/login'; // Redirect to login page
      }
    }

    return Promise.reject(err);
  }
);

export default instance;