import axios from "axios";

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";
const API_URL = `${API_BASE_URL}/auth/`;

const login = (email, password) => {
  return axios
    .post(API_URL + "signin", { email, password })
    .then((response) => {
      if (response.data.accessToken) {
        // Store user data and JWT in local storage
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return response.data;
    });
};

const logout = () => {
  localStorage.removeItem("user");
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

const authService = {
  login,
  logout,
  getCurrentUser,
};

export default authService;