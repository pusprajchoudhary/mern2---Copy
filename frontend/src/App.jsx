import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import MarkAttendance from "./pages/user/MarkAttendance";
import { AuthProvider, useAuth } from "./context/AuthContext";
import UserDashboard from "./pages/user/UserDashboard";

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
            <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
          ) : (
            <LoginForm />
          )
        } 
      />
      
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/*"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/mark-attendance"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <MarkAttendance />
          </ProtectedRoute>
        }
      />

      <Route path="/register" element={<RegisterPage />} />

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
