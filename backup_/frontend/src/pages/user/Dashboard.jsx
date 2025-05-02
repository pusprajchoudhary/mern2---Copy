import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Webcam from "react-webcam";
import { markAttendance } from "../../services/attendanceService";

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
    }
  }, [user, navigate]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!showCamera) {
      setIsCameraEnabled(false);
    }
  }, [showCamera]);

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
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
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header section only */}
      <header className="flex items-center justify-between mb-6 bg-white shadow-sm rounded-xl p-4">
        {/* Left Side - Profile and Username */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
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
            <span className="text-lg font-semibold text-gray-800">{user?.name || 'User'}</span>
            <span className="text-sm text-gray-500">Employee</span>
          </div>
        </div>

        {/* Center - Company Name */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-2xl font-bold text-red-600 whitespace-nowrap">Red Cat Hospitality</h1>
        </div>

        {/* Right Side - Status and Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
            <div className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isCheckedIn ? 'text-green-600' : 'text-red-600'}`}>
              {isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Card with Live Time */}
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
            <button className="border border-white text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Apply Leave
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Days Worked */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Days Worked</h3>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-gray-800">{stats.daysWorked}</span>
              <span className="text-gray-500">/ {stats.totalDays} days</span>
            </div>
          </div>

          {/* Leave Balance */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Leave Balance</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Casual</p>
                <p className="text-xl font-bold text-gray-800">{stats.leaveBalance.casual}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sick</p>
                <p className="text-xl font-bold text-gray-800">{stats.leaveBalance.sick}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vacation</p>
                <p className="text-xl font-bold text-gray-800">{stats.leaveBalance.vacation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Other</p>
                <p className="text-xl font-bold text-gray-800">{stats.leaveBalance.other}</p>
              </div>
            </div>
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

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Recent Activity</h3>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">
                    {activity.type === "checkin" ? "Checked in" :
                     activity.type === "checkout" ? "Checked out" : "Leave request approved"}
                  </p>
                  <p className="text-sm text-gray-500">{activity.date}</p>
                </div>
                <div className="text-right">
                  {activity.time && <p className="font-semibold text-gray-800">{activity.time}</p>}
                  <p className={`text-sm ${
                    activity.status === "On Time" ? "text-green-600" :
                    activity.status === "Late" ? "text-yellow-600" :
                    activity.status === "Leave" ? "text-blue-600" : "text-gray-600"
                  }`}>{activity.status}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-red-600 hover:text-red-700 text-sm">
            View all activity →
          </button>
        </div>

        {/* Upcoming Holidays */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Upcoming Holidays</h3>
          <div className="space-y-4">
            {stats.upcomingHolidays.map((holiday, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-800">
                      {new Date(holiday.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{holiday.name}</p>
                    <p className="text-sm text-gray-500">{holiday.date}</p>
                  </div>
                </div>
                <span className={`text-sm ${
                  holiday.type === "National" ? "text-red-600" : "text-purple-600"
                }`}>
                  {holiday.type}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-4 text-red-600 hover:text-red-700 text-sm">
            View all holidays →
          </button>
        </div>
      </div>

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
