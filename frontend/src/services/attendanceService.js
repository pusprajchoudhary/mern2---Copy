// frontend/src/services/attendanceService.js

import api from './api';
import { startLocationTracking } from './locationService';

// Mark attendance
export const markAttendance = async (formData) => {
  try {
    // Validate form data
    if (!formData.has('image')) {
      throw new Error('Image is required');
    }

    // Validate location data
    const hasLocation = formData.has('location[coordinates][latitude]') && 
                       formData.has('location[coordinates][longitude]');
    
    if (!hasLocation) {
      throw new Error('Location coordinates are required');
    }

    // Get the image file
    const imageFile = formData.get('image');
    if (!(imageFile instanceof File)) {
      throw new Error('Invalid image file');
    }

    // Validate image file
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image file size must be less than 5MB');
    }

    // Add retry logic for server errors
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        const response = await api.post('/attendance/mark', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        });

        if (response.data && response.data.message) {
          return response.data;
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        lastError = error;
        
        if (error.response) {
          // If it's a server error (500), retry
          if (error.response.status === 500) {
            retries--;
            if (retries > 0) {
              // Wait for 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
          // If it's a client error (400), don't retry
          if (error.response.status === 400) {
            throw new Error(error.response.data.message || 'Invalid request data');
          }
        }
        throw error;
      }
    }

    throw lastError || new Error('Failed to mark attendance after multiple attempts');
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to mark attendance');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to mark attendance');
    }
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

export const getTodayAttendance = async () => {
  try {
    const response = await api.get('/attendance/today');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAttendanceByDate = async (date) => {
  try {
    // Format the date to YYYY-MM-DD in local timezone
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      throw new Error('Invalid date provided');
    }

    const year = formattedDate.getFullYear();
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Add retry logic
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        const response = await api.get(`/attendance/date/${dateString}`);
        
        // Validate and transform the response data
        const validatedData = response.data.map(log => ({
          ...log,
          timestamp: log.timestamp ? new Date(log.timestamp) : null,
          location: log.location ? {
            ...log.location,
            lastUpdated: log.location.lastUpdated ? new Date(log.location.lastUpdated) : null
          } : null,
          locationHistory: log.locationHistory ? log.locationHistory.map(loc => ({
            ...loc,
            time: loc.time ? new Date(loc.time) : null
          })) : []
        }));

        return validatedData;
      } catch (error) {
        lastError = error;
        
        if (error.response) {
          // If it's a server error (500), retry
          if (error.response.status === 500) {
            retries--;
            if (retries > 0) {
              // Wait for 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
          // If it's a client error (400), don't retry
          if (error.response.status === 400) {
            throw new Error(error.response.data.message || 'Invalid date format');
          }
        }
        throw error;
      }
    }
    
    throw lastError;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch attendance data');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw new Error(error.message || 'Failed to fetch attendance data');
    }
  }
};

export const exportAttendance = async (date) => {
  try {
    // Format the date to YYYY-MM-DD in UTC
    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      throw new Error('Invalid date format');
    }

    const year = formattedDate.getUTCFullYear();
    const month = String(formattedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(formattedDate.getUTCDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    // Add retry logic for server errors
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        const response = await api.get('/attendance/export', {
          params: { date: dateString },
          responseType: 'blob',
          timeout: 60000 // Increase timeout to 60 seconds
        });

        // Check if the response is a blob
        if (response.data instanceof Blob) {
          const contentType = response.data.type;
          if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            // Create a download link
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance-${dateString}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return response.data;
          } else {
            // If not an Excel file, try to read it as text
            const text = await response.data.text();
            try {
              const errorData = JSON.parse(text);
              throw new Error(errorData.message || 'Failed to export attendance data');
            } catch (e) {
              throw new Error('Invalid response format from server');
            }
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        lastError = error;
        
        if (error.response) {
          // Handle specific HTTP status codes
          if (error.response.status === 404) {
            throw new Error('No attendance records found for the selected date');
          } else if (error.response.status === 400) {
            throw new Error('Invalid date format or request');
          } else if (error.response.status === 500) {
            // Only retry on server errors
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
              continue;
            }
          }
        }
        
        // If we've exhausted retries or it's not a retryable error, throw the last error
        if (retries === 0) {
          throw new Error('Failed to export attendance after multiple attempts. Please try again later.');
        }
        throw error;
      }
    }
  } catch (error) {
    throw new Error(error.message || 'Failed to export attendance data');
  }
};

// Update location for attendance
export const updateAttendanceLocation = async (attendanceId, locationData) => {
  try {
    const response = await api.put(`/attendance/${attendanceId}/location`, locationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Start location tracking for attendance
export const startAttendanceLocationTracking = async (attendanceId, onLocationUpdate) => {
  const handleLocationUpdate = async (locationData) => {
    try {
      await updateAttendanceLocation(attendanceId, {
        coordinates: {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude
        },
        address: locationData.address,
        lastUpdated: locationData.lastUpdated
      });
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
    } catch (error) {
      // Don't throw error to keep tracking running
    }
  };

  const { start, stop } = await startLocationTracking(handleLocationUpdate);
  
  // Start tracking immediately
  start();

  return {
    start,
    stop,
    updateNow: async () => {
      try {
        await handleLocationUpdate({
          coordinates: await getCurrentLocation(),
          address: 'Updating...',
          lastUpdated: new Date()
        });
      } catch (error) {
        // Don't throw error to keep tracking running
      }
    }
  };
};

export default {
  markAttendance,
  getAttendanceHistory,
  getTodayAttendance,
  getAttendanceByDate,
  exportAttendance
};
