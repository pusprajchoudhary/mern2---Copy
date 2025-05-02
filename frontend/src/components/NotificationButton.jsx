import React, { useState, useEffect, useRef } from 'react';
import { getActiveNotifications } from '../services/notificationService';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const NotificationButton = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const prevNotificationIds = useRef([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    let intervalId;
    const fetchNotifications = async () => {
      try {
        const response = await getActiveNotifications();
        if (response.success) {
          const latestNotifications = response.notifications.slice(0, 5);
          setNotifications(latestNotifications);

          // Detect new notification
          const newIds = latestNotifications.map(n => n._id);
          if (
            prevNotificationIds.current.length > 0 &&
            newIds[0] &&
            newIds[0] !== prevNotificationIds.current[0]
          ) {
            toast.info('New notification received!');
          }
          prevNotificationIds.current = newIds;
        }
      } catch (error) {
        toast.error('Failed to fetch notifications');
      }
    };

    fetchNotifications();
    intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleClick = () => {
    setShowModal(!showModal);
  };

  // Only render if user is logged in
  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showModal && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              onClick={handleClick}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <h4 className="font-semibold text-gray-800">
                    {notification.title}
                  </h4>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationButton; 