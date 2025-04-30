import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token-related errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// login
export const login = async (credentials) => {
  try {
    console.log('Attempting login with credentials:', credentials);
    const response = await api.post('/login', credentials);
    console.log('Login response:', response.data);
    
    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error('Invalid response from server');
    }

    // Store token and user data
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    console.log('Token stored:', localStorage.getItem('token'));
    console.log('User stored:', localStorage.getItem('user'));

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      // Server responded with an error
      throw new Error(error.response.data.message || 'Login failed');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server');
    } else {
      // Something else went wrong
      throw new Error(error.message || 'Login failed');
    }
  }
};

// register
export const register = async (userData) => {
  try {
    console.log('Attempting registration with data:', userData);
    const response = await api.post('/register', userData);
    console.log('Registration response:', response.data);
    
    if (!response.data || !response.data.token || !response.data.user) {
      throw new Error('Invalid response from server');
    }

    // Store token and user data
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    console.log('Token stored:', localStorage.getItem('token'));
    console.log('User stored:', localStorage.getItem('user'));

    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Registration failed');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Registration failed');
    }
  }
};

// logout
export const logout = () => {
  try {
    console.log('Logging out, clearing storage');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('Storage cleared');
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// get current user
export const getCurrentUser = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Getting current user - Token:', token);
    console.log('Getting current user - User data:', user);
    
    if (!token || !user) {
      console.log('No token or user data found');
      return null;
    }

    const parsedUser = JSON.parse(user);
    console.log('Parsed user data:', parsedUser);
    return parsedUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser
};
