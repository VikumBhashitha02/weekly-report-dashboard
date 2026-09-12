import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

// Guard
import ProtectedRoute from '../components/common/ProtectedRoute';
import PageLoader from '../components/ui/PageLoader';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';
import StatusPage from '../pages/StatusPage';

// Team Member Pages
import MyReportsPage from '../pages/member/MyReportsPage';
import CreateReportPage from '../pages/member/CreateReportPage';
import EditReportPage from '../pages/member/EditReportPage';
import ReportDetailPage from '../pages/member/ReportDetailPage';

// Manager Admin Pages (Placeholders for Phase 11)
import DashboardPage from '../pages/manager/DashboardPage';
import ReviewInboxPage from '../pages/manager/ReviewInboxPage';
import ReviewDetailPage from '../pages/manager/ReviewDetailPage';
import ProjectsPage from '../pages/manager/ProjectsPage';
import TeamPage from '../pages/manager/TeamPage';

// Shared User Profile Page
import ProfilePage from '../pages/ProfilePage';


/**
 * Root Index Redirect Handler
 * Determines destination based on current authentication state and role
 */
function RootRedirect() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <PageLoader message="Initializing workspace..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'MANAGER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/reports" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Dynamic Redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Public System Pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/status" element={<StatusPage />} />

      {/* Protected Routes inside Main Shell */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Team Member Routes */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['TEAM_MEMBER', 'MANAGER_ADMIN']}>
              <MyReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/new"
          element={
            <ProtectedRoute allowedRoles={['TEAM_MEMBER']}>
              <CreateReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute allowedRoles={['TEAM_MEMBER', 'MANAGER_ADMIN']}>
              <ReportDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['TEAM_MEMBER']}>
              <EditReportPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Admin Exclusive Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['MANAGER_ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute allowedRoles={['MANAGER_ADMIN']}>
              <ReviewInboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/:id"
          element={
            <ProtectedRoute allowedRoles={['MANAGER_ADMIN']}>
              <ReviewDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={['MANAGER_ADMIN']}>
              <ProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute allowedRoles={['MANAGER_ADMIN']}>
              <TeamPage />
            </ProtectedRoute>
          }
        />

        {/* User Profile Route (Both TEAM_MEMBER and MANAGER_ADMIN) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['TEAM_MEMBER', 'MANAGER_ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

