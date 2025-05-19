import React from 'react';

const UserDashboard = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to your Dashboard</h2>
          <p className="text-gray-600">
            This is your personal dashboard where you can view your attendance, leaves, and other information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 