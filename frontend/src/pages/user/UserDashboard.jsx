import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';
import { markAttendance } from '../../services/attendanceService';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logoutUser, loading } = useAuth();
  const webcamRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        if (!user || user.role !== 'user') {
          navigate('/login');
          return;
        }
      }
    };

    checkAuth();
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check if attendance is already marked for today and if 12 hours have passed
  useEffect(() => {
    const checkAttendanceStatus = () => {
      if (!user?._id) return; // Don't proceed if user is not loaded

      const today = new Date().toISOString().split('T')[0];
      const storedAttendance = localStorage.getItem(`attendance_${user._id}_${today}`);
      
      if (storedAttendance) {
        const attendanceData = JSON.parse(storedAttendance);
        const attendanceTime = new Date(attendanceData.timestamp);
        const currentTime = new Date();
        
        // Calculate time difference in hours
        const hoursDiff = (currentTime - attendanceTime) / (1000 * 60 * 60);
        
        if (hoursDiff >= 12) { // Changed from 24 to 12 hours
          // Reset attendance status after 12 hours
          localStorage.removeItem(`attendance_${user._id}_${today}`);
          setIsCheckedIn(false);
          setCheckInTime(null);
          setMessage('You can mark attendance again');
        } else {
          setIsCheckedIn(true);
          setCheckInTime(new Date(attendanceData.timestamp));
          setMessage('Attendance already marked for today');
        }
      } else {
        // Reset status if no attendance record found for this user
        setIsCheckedIn(false);
        setCheckInTime(null);
        setMessage('You can mark your attendance');
      }
    };

    // Check immediately when component mounts
    checkAttendanceStatus();

    // Set up interval to check every hour
    const interval = setInterval(checkAttendanceStatus, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?._id]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const formatTimeForDisplay = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (stream) {
        setIsCameraEnabled(true);
        setShowCamera(true);
        setMessage("Camera enabled successfully");
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      }
    } catch (err) {
      setMessage("Failed to access camera: " + err.message);
      setIsCameraEnabled(false);
      setShowCamera(false);
    }
  };

  const enableLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          setIsLocationEnabled(true);
          setMessage("Location enabled successfully");
        },
        (error) => {
          console.error('Error getting location:', error);
          setMessage("Failed to access location: " + error.message);
          setIsLocationEnabled(false);
          setUserLocation(null);
        }
      );
    } else {
      setMessage("Geolocation is not supported by your browser");
      setIsLocationEnabled(false);
      setUserLocation(null);
    }
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setShowImagePreview(true);
      setMessage("Image captured successfully!");
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!capturedImage) {
        setMessage("Please capture your image first");
        return;
      }

      if (!isLocationEnabled || !userLocation) {
        setMessage("Please enable location access");
        return;
      }

      // Convert base64 to blob
      const base64Response = await fetch(capturedImage);
      const blob = await base64Response.blob();
      
      // Create a File object from the blob
      const file = new File([blob], `attendance_${user._id}_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Create FormData and append all fields
      const formData = new FormData();
      formData.append('image', file);
      formData.append('location', userLocation);
      formData.append('userId', user._id);
      formData.append('email', user.email);
      formData.append('timestamp', new Date().toISOString());
      formData.append('date', formatDateForDisplay(currentTime));
      formData.append('time', formatTimeForDisplay(currentTime));

      const response = await markAttendance(formData);
      
      setIsCheckedIn(true);
      setCheckInTime(new Date());
      setShowSuccessPopup(true);
      setShowCamera(false);
      setMessage("Attendance marked successfully!");
      toast.success('Attendance marked successfully!');

      // Store attendance status in localStorage with user ID
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`attendance_${user._id}_${today}`, JSON.stringify({
        status: 'marked',
        timestamp: new Date().toISOString(),
        location: userLocation,
        userId: user._id
      }));
    } catch (error) {
      console.error('Error marking attendance:', error);
      const errorMessage = error.response?.data?.message || "Error marking attendance";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 bg-white shadow-sm rounded-xl p-3 sm:p-4">
        {/* Left Side - Profile and Username */}
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 overflow-hidden">
            <img 
              src={user?.profileImage || '/default-avatar.png'} 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-semibold text-gray-800">{user?.name || 'User'}</span>
            <span className="text-xs sm:text-sm text-gray-500">Employee</span>
          </div>
        </div>

        {/* Center - Company Name */}
        <div className="mb-3 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-red-600 whitespace-nowrap text-center">Red Cat Hospitality Pvt Ltd</h1>
        </div>

        {/* Right Side - Status and Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs sm:text-sm font-medium ${isCheckedIn ? 'text-green-600' : 'text-red-600'}`}>
              {isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Welcome Card with Live Time */}
        <div className="bg-red-600 text-white p-4 sm:p-6 rounded-xl shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Welcome back, {user?.name}!</h2>
          <div className="space-y-2">
            <p className="text-base sm:text-lg">{formatDateForDisplay(currentTime)}</p>
            <div className="text-3xl sm:text-4xl font-bold tracking-wider">
              {formatTimeForDisplay(currentTime)}
            </div>
            {isCheckedIn && checkInTime && (
              <p className="text-xs sm:text-sm text-red-200">
                Checked in at {formatTimeForDisplay(checkInTime)}
              </p>
            )}
          </div>
          <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-6">
            <button
              onClick={() => setShowCamera(true)}
              disabled={isCheckedIn}
              className={`px-3 sm:px-4 py-2 rounded-lg ${
                isCheckedIn 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-white text-red-600 hover:bg-gray-100'
              }`}
            >
              {isCheckedIn ? 'Already Checked In' : 'Mark Attendance'}
            </button>
          </div>
        </div>

        {/* Camera and Location Component */}
        {showCamera && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-semibold">Mark Your Attendance</h3>
                <button
                  onClick={() => setShowCamera(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Camera</h4>
                  {isCameraEnabled ? (
                    <>
                      {!showImagePreview ? (
                        <>
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-48 sm:h-64 rounded-lg"
                          />
                          <button
                            onClick={captureImage}
                            className="w-full mt-2 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                          >
                            Capture Image
                          </button>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <img 
                            src={capturedImage} 
                            alt="Captured" 
                            className="w-full h-48 sm:h-64 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => setShowImagePreview(false)}
                            className="w-full py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                          >
                            Retake Image
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-48 sm:h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                      Camera is disabled
                    </div>
                  )}
                  <button
                    onClick={enableCamera}
                    disabled={isCameraEnabled}
                    className={`w-full mt-2 py-2 rounded-lg ${
                      isCameraEnabled
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isCameraEnabled ? 'Camera Enabled' : 'Enable Camera'}
                  </button>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Location & Time</h4>
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2">
                    {isLocationEnabled ? (
                      <>
                        <p className="text-xs sm:text-sm text-gray-600">{userLocation}</p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatDateForDisplay(currentTime)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {formatTimeForDisplay(currentTime)}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-600">Location is disabled</p>
                    )}
                  </div>
                  <button
                    onClick={enableLocation}
                    disabled={isLocationEnabled}
                    className={`w-full mt-2 py-2 rounded-lg ${
                      isLocationEnabled
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {isLocationEnabled ? 'Location Enabled' : 'Enable Location'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={isLoading || !capturedImage || !isLocationEnabled}
                className={`w-full py-2 sm:py-3 rounded-lg text-white font-medium ${
                  isLoading || !capturedImage || !isLocationEnabled
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isLoading ? 'Marking Attendance...' : 'Mark Attendance'}
              </button>

              {message && (
                <p className={`text-xs sm:text-sm ${
                  message.includes('success') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-xl z-10 max-w-md w-full mx-4 relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Attendance Marked Successfully!</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                Checked in at {checkInTime ? formatTimeForDisplay(checkInTime) : ''}
              </p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm sm:text-base font-medium text-white hover:bg-red-700 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard; 