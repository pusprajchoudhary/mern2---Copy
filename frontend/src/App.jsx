import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import MarkAttendance from "./pages/user/MarkAttendance";
import { AuthProvider, useAuth } from "./context/AuthContext";
import UserDashboard from "./pages/user/UserDashboard";
import Login from './pages/Login';
import Dashboard from './pages/user/Dashboard';
import BlockedUser from './pages/BlockedUser';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.isBlocked) {
    return <Navigate to="/blocked" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? (
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/login" 
        element={
          user ? (
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          ) : (
            <LoginForm />
          )
        } 
      />
      
      <Route
        path="/admin/*"
        element={
          <PrivateRoute adminOnly>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/mark-attendance"
        element={
          <PrivateRoute>
            <MarkAttendance />
          </PrivateRoute>
        }
      />

      <Route path="/register" element={<RegisterPage />} />

      <Route path="/blocked" element={<BlockedUser />} />

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
