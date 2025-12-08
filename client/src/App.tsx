import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout/Layout';
import PropertiesList from './pages/Properties/List';
import PropertyEdit from './pages/Properties/Edit';
import ClientsList from './pages/Clients/List';
import UserManagement from './pages/Owner/Users';
import AgencyPortfolio from './pages/Owner/AgencyPortfolio';
import ContentQueue from './pages/Curator/Queue';
import PropertyReview from './pages/Curator/Review';
import './styles/owner-dashboard.css';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

import OwnerDashboardTabs from './components/DashboardTabs/OwnerDashboardTabs';

const Dashboard = () => {
  const { user } = useAuth();

  // --- If not an owner, keep showing the old simple dashboard ---
  if (user?.role !== "owner") {
    return (
      <div>
        <div className="page-header">
          <h1 className="text-3xl font-bold mb-xs">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-secondary">
            {user?.role === "agent" && "Manage your properties and clients from the sidebar"}
            {user?.role === "curator" && "Review properties in the content queue"}
          </p>
        </div>
      </div>
    );
  }

  // --- Owner Analytics Dashboard (Tabbed Interface) ---
  return <OwnerDashboardTabs />;
};


import { ToastProvider } from './context/ToastContext';

const RoleRoute = ({ children, roles }: { children: React.ReactNode, roles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />

              {/* Agent Routes */}
              <Route path="properties" element={
                <RoleRoute roles={['agent']}>
                  <PropertiesList />
                </RoleRoute>
              } />
              <Route path="properties/new" element={
                <RoleRoute roles={['agent', 'owner']}>
                  <PropertyEdit />
                </RoleRoute>
              } />
              <Route path="properties/:id" element={
                <RoleRoute roles={['agent', 'owner']}>
                  <PropertyEdit />
                </RoleRoute>
              } />
              <Route path="clients" element={<ClientsList />} />

              {/* Owner Routes */}
              <Route path="owner/users" element={
                <RoleRoute roles={['owner']}>
                  <UserManagement />
                </RoleRoute>
              } />
              <Route path="owner/portfolio" element={
                <RoleRoute roles={['owner']}>
                  <AgencyPortfolio />
                </RoleRoute>
              } />

              {/* Curator Routes */}
              <Route path="content-queue" element={
                <RoleRoute roles={['curator']}>
                  <ContentQueue />
                </RoleRoute>
              } />
              <Route path="content-queue/:id" element={
                <RoleRoute roles={['curator']}>
                  <PropertyReview />
                </RoleRoute>
              } />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
