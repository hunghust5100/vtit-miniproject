import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import MainLayout from '../components/layout/MainLayout';
import AdminDashboard from '../pages/AdminDashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import UserDashboard from '../pages/UserDashboard';
import UserManagement from '../pages/admin/UserManagement';
import DepartmentManagement from '../pages/admin/DepartmentManagement';
import AssetTypeManagement from '../pages/admin/AssetTypeManagement';
import AssetModelManagement from '../pages/admin/AssetModelManagement';
import AssetInstanceManagement from '../pages/admin/AssetInstanceManagement';
import UserRequests from '../pages/UserRequests';
import AllocationManagement from '../pages/admin/AllocationManagement';
import UserProfile from '../pages/UserProfile';
import UserAllocationHistory from '../pages/UserAllocationHistory';

// Helper to check if a user is authenticated
const useRequireAuth = () => {
  const { user, loading } = useAuth();
  return { isAuthenticated: !!user, role: user?.role, loading };
};

// Guard for protected routes based on roles
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useRequireAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role string (strip ROLE_ prefix if present)
  const normalizedRole = role ? role.replace(/^ROLE_/, '') : '';

  if (!allowedRoles.includes(normalizedRole)) {
    // Redirect to default page of user's actual role
    if (normalizedRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (normalizedRole === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/user" replace />;
  }

  return children;
};

// Guard for public-only routes (like login)
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, role, loading } = useRequireAuth();

  if (loading) return null;

  if (isAuthenticated && role) {
    const normalizedRole = role.replace(/^ROLE_/, '');
    if (normalizedRole === 'ADMIN') return <Navigate to="/admin" replace />;
    if (normalizedRole === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/user" replace />;
  }

  return children;
};

// Component to handle default redirect from `/` based on authenticated role
const RoleBasedRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useRequireAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = role ? role.replace(/^ROLE_/, '') : '';
  if (normalizedRole === 'ADMIN') return <Navigate to="/admin" replace />;
  if (normalizedRole === 'MANAGER') return <Navigate to="/manager" replace />;
  return <Navigate to="/user" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected Routes inside MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'USER']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default Redirect */}
          <Route index element={<RoleBasedRedirect />} />

          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/departments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DepartmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/asset-types"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AssetTypeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/asset-models"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AssetModelManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/asset-instances"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AssetInstanceManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/allocations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AllocationManagement />
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="manager"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* User Routes */}
          <Route
            path="user"
            element={
              <ProtectedRoute allowedRoles={['USER', 'MANAGER']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="user/my-assets"
            element={
              <ProtectedRoute allowedRoles={['USER', 'MANAGER']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="user/requests"
            element={
              <ProtectedRoute allowedRoles={['USER', 'MANAGER']}>
                <UserRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="user/history"
            element={
              <ProtectedRoute allowedRoles={['USER', 'MANAGER']}>
                <UserAllocationHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'USER']}>
                <UserProfile />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback to index redirects */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
