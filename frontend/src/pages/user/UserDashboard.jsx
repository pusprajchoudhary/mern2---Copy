import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState('');
  const { user, logoutUser, loading } = useAuth();

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

  // Update active section based on URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'user') {
      setActiveSection(path);
    }
  }, [location]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
    navigate(`/user/${section}`);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'attendance', label: 'Mark Attendance', icon: '📝' },
    { id: 'leave', label: 'Leave Management', icon: '📅' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'user') {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800">Welcome, {user.name}</h3>
              <p className="text-gray-600">This is your dashboard</p>
            </div>
          </div>
        );
      case 'attendance':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
            <p className="text-gray-600">Attendance marking functionality will be implemented here.</p>
          </div>
        );
      case 'leave':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Leave Management</h2>
            <p className="text-gray-600">Leave management functionality will be implemented here.</p>
          </div>
        );
      case 'profile':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Name</h3>
                <p className="text-gray-600">{user.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Email</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Role</h3>
                <p className="text-gray-600">{user.role}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">User Panel</h1>
        </div>
        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionClick(item.id)}
              className={`flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                activeSection === item.id ? 'bg-red-50 text-red-600' : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {sidebarItems.find(item => item.id === activeSection)?.label}
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard; 