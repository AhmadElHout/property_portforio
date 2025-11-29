import React from 'react';
import { useState, useEffect } from 'react';
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

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role !== "owner") return;

    const loadStats = async () => {
      const response = await fetch("http://localhost:3000/api/owner/performance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setStats(await response.json());
      }
    };

    loadStats();
  }, [user, token]);

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

  // --- Owner Performance Dashboard ---
  return (
    <div className="owner-dashboard">
      <div className="page-header">
        <h1 className="text-3xl font-bold mb-xs">Agency Performance Overview</h1>
        <p className="text-secondary">Real-time insights into agent activity and performance</p>
      </div>

      {/* KPI CARDS */}
      <div className="kpi-grid fade-in">
        <div className="kpi-card">
          <h3>{stats?.total_agents ?? "—"}</h3>
          <p>Total Agents</p>
        </div>
        <div className="kpi-card">
          <h3>{stats?.total_properties ?? "—"}</h3>
          <p>Total Properties</p>
        </div>
        <div className="kpi-card">
          <h3>{stats?.properties_this_month ?? "—"}</h3>
          <p>New This Month</p>
        </div>
        <div className="kpi-card">
          <h3>{stats?.total_clients ?? "—"}</h3>
          <p>Total Clients</p>
        </div>
      </div>

      {/* TOP AGENTS */}
      <h2 className="section-title">Top Performing Agents</h2>
      <div className="performance-table fade-in">
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Properties Added</th>
              <th>Clients Added</th>
              <th>Notes Created</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.agents || []).map((agent: any) => (
              <tr key={agent.id}>
                <td>{agent.name}</td>
                <td>{agent.properties_added}</td>
                <td>{agent.clients_added}</td>
                <td>{agent.notes_created}</td>
                <td><strong>{agent.score}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECENT ACTIVITY */}
      <h2 className="section-title">Recent Activity</h2>
      <div className="activity-feed fade-in">
        {(stats?.recent_activity || []).map((item: any, index: number) => (
          <div className="activity-item" key={index}>
            <span>📌</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
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
