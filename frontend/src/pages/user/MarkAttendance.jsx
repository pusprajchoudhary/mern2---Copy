import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Webcam from "react-webcam";
import attendanceService from "../../services/attendanceService";

const MarkAttendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');
  const [image, setImage] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [message, setMessage] = useState('');
  const [attendanceDone, setAttendanceDone] = useState(false);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocation('Location access denied');
          }
        );
      } else {
        setLocation('Geolocation not supported');
      }
    };

    fetchLocation();
    const locationInterval = setInterval(fetchLocation, 10000);
    return () => clearInterval(locationInterval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleString());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const captureImage = () => {
    const capturedImage = webcamRef.current.getScreenshot();
    setImage(capturedImage);
    setCapturing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image || !location) {
      setMessage('Please capture an image and allow location access.');
      return;
    }

    const blob = await (await fetch(image)).blob();
    const file = new File([blob], 'attendance.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('location', location);
    formData.append('image', file);

    try {
      const res = await attendanceService.markAttendance(formData);
      setMessage(res.message || 'Attendance marked successfully');
      setAttendanceDone(true);
      setImage(null);
      
      // Store attendance status in localStorage
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`attendance_${today}`, JSON.stringify({
        status: 'marked',
        timestamp: new Date().toISOString(),
        location: location
      }));
    } catch (error) {
      console.error(error);
      setMessage('Error marking attendance');
    }
  };

  // Check if attendance is already marked for today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storedAttendance = localStorage.getItem(`attendance_${today}`);
    if (storedAttendance) {
      const attendanceData = JSON.parse(storedAttendance);
      setAttendanceDone(true);
      setMessage('Attendance already marked for today');
    }
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-gradient-to-br from-white to-blue-50 shadow-2xl rounded-3xl animate-fade-in">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700">Mark Your Attendance</h2>

      <div className="text-center text-gray-600 mb-6">
        <p className="text-lg">Current Time:</p>
        <p className="font-semibold text-xl">{time || "Loading time..."}</p>
      </div>

      {attendanceDone ? (
        <div className="text-center">
          <h3 className="text-2xl font-bold text-green-600 mb-4 animate-bounce">
            Thank you, {user?.name}!
          </h3>
          <p className="text-gray-700">Your attendance has been recorded successfully.</p>
        </div>
      ) : (
        <>
          {capturing ? (
            <div className="mb-6">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                height="100%"
                className="rounded-xl shadow-lg"
              />
              <button
                onClick={captureImage}
                className="mt-4 w-full bg-green-500 hover:bg-green-600 transition-all duration-300 text-white font-bold py-2 px-4 rounded-xl"
              >
                Capture
              </button>
            </div>
          ) : (
            <div className="mb-6 text-center">
              {image ? (
                <img src={image} alt="Captured" className="rounded-xl w-full shadow-md" />
              ) : (
                <button
                  onClick={() => setCapturing(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 text-white font-bold py-2 px-4 rounded-xl"
                >
                  Start Camera
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Location:</label>
              <input
                type="text"
                value={location}
                readOnly
                className="w-full p-3 border rounded-xl bg-gray-100 shadow-inner"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-500 hover:bg-purple-600 transition-all duration-300 text-white font-bold py-3 px-6 rounded-xl"
            >
              Submit Attendance
            </button>
          </form>
        </>
      )}

      {message && (
        <div className="mt-6 text-center text-green-700 font-semibold animate-fade-in-up">
          {message}
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
