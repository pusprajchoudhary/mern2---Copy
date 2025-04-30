import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAddModal from '../../components/admin/UserAddModal';
import { getUsers } from '../../services/userService';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { getAttendanceByDate } from '../../services/attendanceService';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [error, setError] = useState('');
  const { user, logoutUser, loading } = useAuth();

  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Update active section based on URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'admin') {
      setActiveSection(path);
    }
  }, [location]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        if (!user || user.role !== 'admin') {
          navigate('/login');
          return;
        }
        try {
          await fetchUsers();
        } catch (error) {
          console.error('Error fetching users:', error);
          setError('Failed to fetch users. Please try again.');
        }
      }
    };

    checkAuth();
  }, [user, loading, navigate]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    }
  };

  const fetchAttendanceData = async (date) => {
    try {
      setAttendanceLoading(true);
      const data = await getAttendanceByDate(date);
      setAttendanceLogs(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'attendance') {
      fetchAttendanceData(selectedDate);
    }
  }, [activeSection, selectedDate]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const handleUserAdded = (newUser) => {
    setUsers([...users, newUser]);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleSectionClick = (section) => {
    setActiveSection(section);
    navigate(`/admin/${section}`);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📝' },
    { id: 'leave', label: 'Leave Management', icon: '📅' },
    { id: 'report', label: 'Report', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800">Total Users</h3>
              <p className="text-3xl font-bold text-red-600">{users.length}</p>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'attendance':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Calendar</h2>
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                className="w-full border-none"
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Attendance Logs for {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              
              {attendanceLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : attendanceLogs.length > 0 ? (
                <div className="space-y-4">
                  {attendanceLogs.map((log) => (
                    <div key={log._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{log.user.name}</h3>
                          <p className="text-sm text-gray-600">
                            Time: {format(new Date(log.timestamp), 'hh:mm a')}
                          </p>
                          <p className="text-sm text-gray-600">
                            Location: {log.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No attendance records found for this date
                </div>
              )}
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
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
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
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Add User
              </button>
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

      {/* User Add Modal */}
      <UserAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
};

export default AdminDashboard;
