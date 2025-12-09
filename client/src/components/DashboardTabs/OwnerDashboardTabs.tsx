import { useState } from 'react';
import MonthNavigatorPerformance from '../Dashboard/Analytics/MonthNavigatorPerformance';
import AvgTimeToCloseLocation from '../Dashboard/Analytics/AvgTimeToCloseLocation';
import AvgTimeToCloseBudget from '../Dashboard/Analytics/AvgTimeToCloseBudget';
import AvgTimeToCloseAge from '../Dashboard/Analytics/AvgTimeToCloseAge';
import HotPreferencesDashboard from '../Dashboard/Analytics/HotPreferencesDashboard';
import PropertyFarmingRecommendations from '../Dashboard/Analytics/PropertyFarmingRecommendations';
import ExistingOwnerInsights from './ExistingOwnerInsights';

const OwnerDashboardTabs = () => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        { id: 0, label: '📊 Monthly Closure Ratio', icon: '📊' },
        { id: 1, label: '⏱️ Time-to-Close Insights', icon: '⏱️' },
        { id: 2, label: '🔥 Hot Preferences', icon: '🔥' },
        { id: 3, label: '🎯 Farming Recommendations', icon: '🎯' },
        { id: 4, label: '📈 Performance Overview', icon: '📈' }
    ];

    return (
        <div className="owner-dashboard">
            <div className="page-header">
                <h1 className="text-3xl font-bold mb-xs">Owner Analytics Dashboard</h1>
                <p className="text-secondary">Comprehensive insights and recommendations for your agency</p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-xl)',
                borderBottom: '2px solid var(--border)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: 'var(--space-md) var(--space-lg)',
                            background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                            transition: 'all 0.3s',
                            whiteSpace: 'nowrap',
                            borderRadius: activeTab === tab.id ? 'var(--radius-md) var(--radius-md) 0 0' : '0'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ minHeight: '500px' }}>
                {activeTab === 0 && (
                    <div className="fade-in">
                        <MonthNavigatorPerformance />
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="fade-in">
                        <h2 className="section-title">Average Time-to-Close Insights</h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: 'var(--space-lg)'
                        }}>
                            <AvgTimeToCloseLocation />
                            <AvgTimeToCloseBudget />
                            <AvgTimeToCloseAge />
                        </div>
                    </div>
                )}

                {activeTab === 2 && (
                    <div className="fade-in">
                        <HotPreferencesDashboard />
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="fade-in">
                        <PropertyFarmingRecommendations />
                    </div>
                )}

                {activeTab === 4 && (
                    <div className="fade-in">
                        <ExistingOwnerInsights />
                    </div>
                )}
            </div>
        </div>
    );
};

export default OwnerDashboardTabs;
