import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Webcam from "react-webcam";
import { markAttendance } from "../../services/attendanceService";
import { getLatestNotification, markNotificationAsRead } from '../../services/notificationService';
import { toast } from 'react-toastify';
import NotificationButton from "../../components/NotificationButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const webcamRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [location, setLocation] = useState("Location access denied");
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [error, setError] = useState('');

  // Mock data (you'll need to implement these with real data from your backend)
  const stats = {
    daysWorked: 18,
    totalDays: 22,
    leaveBalance: {
      casual: 5,
      sick: 3,
      vacation: 4,
      other: 0
    },
    attendanceRate: {
      rate: 95,
      onTime: 17,
      late: 1,
      absent: 0
    },
    recentActivity: [
      { type: "checkin", time: "09:05 AM", date: "Today", status: "On Time" },
      { type: "checkout", time: "06:30 PM", date: "Yesterday", status: "Regular" },
      { type: "checkin", time: "09:15 AM", date: "Yesterday", status: "Late" },
      { type: "leave", time: "", date: "Apr 23, 2025", status: "Leave" }
    ],
    upcomingHolidays: [
      { date: "May 30, 2025", name: "Memorial Day", type: "National" },
      { date: "June 19, 2025", name: "Juneteenth", type: "National" },
      { date: "July 4, 2025", name: "Independence Day", type: "National" },
      { date: "July 15, 2025", name: "Company Foundation Day", type: "Company" }
    ]
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          },
          () => {
            setLocation("Location access denied");
          }
        );
      }
    };

    getLocation();
    const locationInterval = setInterval(getLocation, 30000);

    return () => clearInterval(locationInterval);
  }, [user, navigate]);

  useEffect(() => {
    if (!showCamera) {
      setIsCameraEnabled(false);
    }
  }, [showCamera]);

  const handleLogout = async () => {
    try {
      // Perform logout
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
    }
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

  const formatForDatabase = (date) => {
    return {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      time: date.toTimeString().split(' ')[0], // HH:MM:SS
      timestamp: date.toISOString(), // Full ISO timestamp
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // User's timezone
    };
  };

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (stream) {
        setIsCameraEnabled(true);
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      }
    } catch (err) {
      setMessage("Failed to access camera: " + err.message);
      setIsCameraEnabled(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setError('');
      const response = await markAttendance();
      setAttendanceStatus(response.message);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsLoading(true);
      setMessage("");

      if (!isCameraEnabled || !webcamRef.current) {
        setMessage("Please enable camera first");
        return;
      }

      if (location === "Location access denied") {
        setMessage("Please enable location access");
        return;
      }

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setMessage("Failed to capture image");
        return;
      }

      // Get current time data
      const now = new Date();
      const timeData = formatForDatabase(now);

      // Convert base64 to blob
      const blob = await fetch(imageSrc).then(r => r.blob());
      const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("location", location);
      formData.append("image", file);
      formData.append("date", timeData.date);
      formData.append("time", timeData.time);
      formData.append("timestamp", timeData.timestamp);
      formData.append("timezone", timeData.timezone);

      const response = await markAttendance(formData);
      
      // Update states for successful check-in
      setIsCheckedIn(true);
      setCheckInTime(now);
      setShowCamera(false);
      setShowSuccessPopup(true);
      
      // Hide success popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 3000);
    } catch (error) {
      setMessage("Failed to mark attendance: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* <NotificationBanner /> */}
      
      {/* Header section */}
      <header className="bg-white shadow-sm px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Left - Profile */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
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
            <div>
              <span className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</span>
              <span className="text-xs text-gray-500 block">Employee</span>
            </div>
          </div>

          {/* Center - Company Name */}
          <h1 className="text-xl font-bold text-red-600">Red Cat Hospitality</h1>

          {/* Right - Status and Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-xs font-medium ${isCheckedIn ? 'text-green-600' : 'text-red-600'}`}>
                {isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
            {/* Notification Bell */}
            <NotificationButton />
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="min-h-[500px] bg-white rounded-lg shadow-sm">
          {/* Welcome Card with Live Time */}
          <div className="space-y-6">
            <div className="bg-red-600 text-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold mb-4">Welcome back, {user?.name}!</h2>
              <div className="space-y-2">
                <p className="text-lg">{formatDateForDisplay(currentTime)}</p>
                <div className="text-4xl font-bold tracking-wider">
                  {formatTimeForDisplay(currentTime)}
                </div>
                {isCheckedIn && checkInTime && (
                  <p className="text-sm text-red-200">
                    Checked in at {formatTimeForDisplay(checkInTime)}
                  </p>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCamera(true)}
                  disabled={isCheckedIn}
                  className={`px-4 py-2 rounded-lg ${
                    isCheckedIn 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-white text-red-600 hover:bg-gray-100'
                  }`}
                >
                  {isCheckedIn ? 'Already Checked In' : 'Mark Attendance'}
                </button>
              </div>
            </div>

            {/* Camera Section */}
            {showCamera && (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Camera Verification</h3>
                <div className="space-y-4">
                  {/* Current Time Display */}
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Current Time</p>
                    <p className="text-xl font-bold text-gray-800">{formatTimeForDisplay(currentTime)}</p>
                    <p className="text-sm text-gray-600">{formatDateForDisplay(currentTime)}</p>
                  </div>

                  {isCameraEnabled ? (
                    <div className="relative">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full rounded-lg"
                        onUserMediaError={(err) => {
                          setMessage("Camera error: " + err.message);
                          setIsCameraEnabled(false);
                        }}
                      />
                      {isLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="text-white">Processing...</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                      <p className="text-gray-500">Camera is not active</p>
                      <button
                        onClick={enableCamera}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                      >
                        Enable Camera
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold">{isCheckedIn ? "Checked In" : "Not Checked In"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">{location}</p>
                    </div>
                  </div>
                  {message && (
                    <div className={`p-3 rounded-lg text-center ${
                      message.includes("Success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {message}
                    </div>
                  )}
                  <button
                    onClick={handleCheckIn}
                    disabled={!isCameraEnabled || isLoading || isCheckedIn}
                    className={`w-full py-2 rounded-lg ${
                      !isCameraEnabled || isLoading || isCheckedIn
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white`}
                  >
                    {isLoading ? "Processing..." : isCheckedIn ? "Already Checked In" : "Check In"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-8 shadow-xl z-10 max-w-md w-full mx-4 relative">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Marked Successfully!</h3>
              <p className="text-sm text-gray-500 mb-4">
                Checked in at {checkInTime ? formatTimeForDisplay(checkInTime) : ''}
              </p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:text-sm"
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

export default Dashboard;
