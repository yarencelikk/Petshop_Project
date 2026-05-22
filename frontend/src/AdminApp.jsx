import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./Admin/Dashboard";
import AdminLogin from "./Admin/AdminLogin";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || user?.role !== "admin") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AdminApp() {
  const basename = window.location.pathname.startsWith("/admin")
    ? "/admin"
    : "";

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route
          path="/"
          element={
            <AdminProtectedRoute>
              <Dashboard />
            </AdminProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default AdminApp;
