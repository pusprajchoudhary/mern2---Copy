import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // User's role is not authorized, show error message and redirect to appropriate dashboard
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600 mb-4">
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => window.location.href = user.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Go to {user.role === 'admin' ? 'Admin' : 'User'} Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Authorized, render component
  return children;
};

export default ProtectedRoute; 