import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const createUser = async (userData) => {
  try {
    console.log('Attempting to create user with data:', userData);
    const response = await api.post('/users', userData);
    console.log('Create user response:', response.data);

    if (!response.data) {
      console.error('No data received from server in createUser');
      throw new Error('No data received from server');
    }

    return response.data;
  } catch (error) {
    console.error('Error in createUser:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create user');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Failed to create user');
    }
  }
};

export const getUsers = async () => {
  try {
    console.log('Attempting to fetch users');
    const response = await api.get('/users');
    console.log('Get users response:', response.data);

    if (!response.data) {
      console.error('No data received from server in getUsers');
      throw new Error('No data received from server');
    }

    return response.data;
  } catch (error) {
    console.error('Error in getUsers:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch users');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Failed to fetch users');
    }
  }
};
