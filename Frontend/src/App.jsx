import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';

// Public Pages
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage } from './pages/Auth/LoginPage';

// User Pages
import { UserDashboard } from './pages/User/UserDashboard';
import { LiveMapPage } from './pages/User/LiveMapPage';
import { RoutePlanningPage } from './pages/User/RoutePlanningPage';
import { VehiclesPage } from './pages/User/VehiclesPage';
import { ReportIncidentPage } from './pages/User/ReportIncidentPage';
import { IncidentMonitoringPage } from './pages/User/IncidentMonitoringPage';
import { AccessibilityPage } from './pages/User/AccessibilityPage';
import { OfflineSyncPage } from './pages/User/OfflineSyncPage';
import { AnalyticsPage } from './pages/User/AnalyticsPage';
import { SettingsPage } from './pages/User/SettingsPage';

// Admin Pages
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminFleetPage } from './pages/Admin/AdminFleetPage';
import { AdminIncidentsPage } from './pages/Admin/AdminIncidentsPage';
import { AdminUsersPage } from './pages/Admin/AdminUsersPage';
import { AdminMLPage } from './pages/Admin/AdminMLPage';
import { AdminGISDataPage } from './pages/Admin/AdminGISDataPage';
import { AdminSystemHealthPage } from './pages/Admin/AdminSystemHealthPage';
import { AdminSettingsPage } from './pages/Admin/AdminSettingsPage';

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Operator / User Protected Routes */}
            <Route
              path="/user"
              element={
                <ProtectedRoute requiredRole="user">
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="map" element={<LiveMapPage />} />
              <Route path="routes" element={<RoutePlanningPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="report-incident" element={<ReportIncidentPage />} />
              <Route path="incidents" element={<IncidentMonitoringPage />} />
              <Route path="accessibility" element={<AccessibilityPage />} />
              <Route path="sync" element={<OfflineSyncPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Admin HQ Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="map" element={<LiveMapPage />} />
              <Route path="fleet" element={<AdminFleetPage />} />
              <Route path="incidents" element={<AdminIncidentsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="ml-monitoring" element={<AdminMLPage />} />
              <Route path="gis-data" element={<AdminGISDataPage />} />
              <Route path="system-health" element={<AdminSystemHealthPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
