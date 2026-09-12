import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageLoader from '../ui/PageLoader';

/**
 * Role-Aware Route Guard
 * Enforces authentication and specific role authorization.
 *
 * @param {object} props
 * @param {string[]} [props.allowedRoles] - Optional list of authorized roles (e.g. ['MANAGER_ADMIN'])
 * @param {React.ReactNode} [props.children] - Child elements to render if authorized
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Show loader while verifying session with backend
  if (loading) {
    return <PageLoader message="Verifying session..." />;
  }

  // 2. Redirect unauthenticated users to login, preserving intended return route
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Render children or Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
}
