// frontend/src/services/attendanceService.js

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

// Mark attendance
export const markAttendance = async (formData) => {
  try {
    const response = await api.post('/attendance/mark', formData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get attendance history
export const getAttendanceHistory = async () => {
  try {
    const response = await api.get('/attendance/history');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAttendanceByDate = async (date) => {
  try {
    // Format the date to YYYY-MM-DD in UTC
    const formattedDate = new Date(date);
    const year = formattedDate.getUTCFullYear();
    const month = String(formattedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getUTCDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('Fetching attendance for date:', dateString);
    const response = await api.get(`/attendance/date/${dateString}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance data:', error);
    throw error;
  }
};

export const exportAttendance = async (date) => {
  try {
    // Format the date to YYYY-MM-DD in UTC
    const formattedDate = new Date(date);
    const year = formattedDate.getUTCFullYear();
    const month = String(formattedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getUTCDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('Exporting attendance for date:', dateString);
    const response = await api.get(`/attendance/export`, {
      params: { date: dateString },
      responseType: 'blob'
    });

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error('Failed to export attendance data');
    }
  } catch (error) {
    console.error('Error exporting attendance:', error);
    if (error.response?.data) {
      // Try to parse the error message if it's JSON
      try {
        const errorData = JSON.parse(await error.response.data.text());
        throw new Error(errorData.message || 'Failed to export attendance data');
      } catch (e) {
        throw new Error('Failed to export attendance data');
      }
    }
    throw error;
  }
};

export default {
  markAttendance,
  getAttendanceHistory,
  getAttendanceByDate,
  exportAttendance
};
