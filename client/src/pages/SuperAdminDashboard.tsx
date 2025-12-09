import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GlobalOverview from '../components/SuperAdmin/GlobalOverview';
import AgenciesComparison from '../components/SuperAdmin/AgenciesComparison';
import SuperAdminClosureRatio from '../components/SuperAdmin/SuperAdminClosureRatio';
import TimeToCloseInsights from '../components/SuperAdmin/TimeToCloseInsights';
import MarketDemand from '../components/SuperAdmin/MarketDemand';
import FarmingRecommendations from '../components/SuperAdmin/FarmingRecommendations';
import DatabaseInspector from '../components/SuperAdmin/DatabaseInspector';

const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        // Check if user is super admin
        if (!user || user.role !== 'super_admin') {
            navigate('/login');
        }
    }, [user, navigate]);

    const tabs = [
        { id: 0, label: '🌍 Global Overview', icon: '🌍' },
        { id: 1, label: '🏢 Agencies Comparison', icon: '🏢' },
        { id: 2, label: '📊 Closure Ratio', icon: '📊' },
        { id: 3, label: '⏱️ Time-to-Close', icon: '⏱️' },
        { id: 4, label: '🔥 Market Demand', icon: '🔥' },
        { id: 5, label: '🎯 Farming Insights', icon: '🎯' },
        { id: 6, label: '🗄️ Database Inspector', icon: '🗄️' }
    ];

    if (!user || user.role !== 'super_admin') {
        return null;
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: 'var(--space-xl)'
        }}>
            {/* Header */}
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-xl)',
                marginBottom: 'var(--space-xl)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '8px'
                        }}>
                            Platform Administration
                        </h1>
                        <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>
                            Super Admin Dashboard - Multi-Agency Analytics & Management
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span>👑</span>
                            <span>Super Admin</span>
                        </div>
                        <button
                            onClick={() => {
                                logout();
                                navigate('/login');
                            }}
                            style={{
                                padding: '12px 24px',
                                background: '#EF4444',
                                borderRadius: 'var(--radius-md)',
                                color: 'white',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = '#DC2626')}
                            onMouseOut={(e) => (e.currentTarget.style.background = '#EF4444')}
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    borderBottom: '2px solid #E5E7EB',
                    overflowX: 'auto',
                    background: '#F9FAFB'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '16px 24px',
                                background: activeTab === tab.id
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : 'transparent',
                                color: activeTab === tab.id ? 'white' : '#4B5563',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid transparent' : '3px solid transparent',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: activeTab === tab.id ? '700' : '500',
                                transition: 'all 0.3s',
                                whiteSpace: 'nowrap',
                                borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
                            <span>{tab.label.replace(tab.icon + ' ', '')}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div style={{ padding: 'var(--space-xl)', minHeight: '600px' }}>
                    {activeTab === 0 && <GlobalOverview />}
                    {activeTab === 1 && <AgenciesComparison />}
                    {activeTab === 2 && <SuperAdminClosureRatio />}
                    {activeTab === 3 && <TimeToCloseInsights />}
                    {activeTab === 4 && <MarketDemand />}
                    {activeTab === 5 && <FarmingRecommendations />}
                    {activeTab === 6 && <DatabaseInspector />}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
