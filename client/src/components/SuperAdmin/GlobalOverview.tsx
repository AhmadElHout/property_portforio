import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const GlobalOverview = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        fetchStats();
        const interval = setInterval(() => {
            fetchStats();
        }, 5 * 60 * 1000); // Refresh every 5 minutes

        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/superadmin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMinutesAgo = () => {
        const diff = Math.floor((new Date().getTime() - lastUpdated.getTime()) / 60000);
        return diff === 0 ? 'Just now' : `${diff} minute${diff > 1 ? 's' : ''} ago`;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '6px solid #E5E7EB',
                    borderTop: '6px solid #667eea',
                    borderRadius: '50%',
                    margin: '0 auto 24px',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>Loading platform analytics...</p>
                <style>{`
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Last Updated */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 'var(--space-lg)',
                fontSize: '0.875rem',
                color: '#6B7280'
            }}>
                🔄 Last updated: <strong style={{ marginLeft: '6px', color: '#374151' }}>{getMinutesAgo()}</strong>
            </div>

            {/* Top KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-lg)',
                marginBottom: 'var(--space-xl)'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: 'var(--space-xl)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>Total Agencies</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.databases_count || 0}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>
                        {stats?.databases?.join(', ') || 'N/A'}
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #00BFFF 0%, #1E90FF 100%)',
                    padding: 'var(--space-xl)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(30, 144, 255, 0.3)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>Total Properties</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.total_properties || 0}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>Across all agencies</div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: 'var(--space-xl)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>Properties Closed</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.total_closed || 0}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>
                        {stats?.closure_rate || 0}% closure rate
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    padding: 'var(--space-xl)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>Total Agents</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.total_agents || 0}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>Active platform users</div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                    padding: 'var(--space-xl)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(236, 72, 153, 0.3)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>Total Clients</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.total_clients || 0}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>Registered clients</div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    padding: 'var(--space-xl)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'white',
                    boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3)'
                }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>This Month</div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: '1' }}>{stats?.properties_this_month || 0}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>New properties</div>
                </div>
            </div>

            {/* Top Locations */}
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 'var(--space-lg)', color: '#1F2937' }}>
                    🗺️ Top Locations
                </h3>
                <div style={{
                    background: '#F9FAFB',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    border: '1px solid #E5E7EB'
                }}>
                    {stats?.top_locations?.slice(0, 10).map((loc: any, idx: number) => (
                        <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 'var(--space-md)',
                            marginBottom: idx < 9 ? 'var(--space-sm)' : 0,
                            background: 'white',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #E5E7EB'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: idx < 3 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#E5E7EB',
                                    color: idx < 3 ? 'white' : '#6B7280',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.875rem'
                                }}>
                                    {idx + 1}
                                </div>
                                <span style={{ fontWeight: '600', color: '#374151' }}>{loc.location}</span>
                            </div>
                            <div style={{
                                padding: '6px 16px',
                                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                                borderRadius: 'var(--radius-md)',
                                color: '#1E40AF',
                                fontWeight: '700'
                            }}>
                                {loc.count} properties
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price Range Distribution */}
            <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 'var(--space-lg)', color: '#1F2937' }}>
                    💰 Price Range Distribution
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-md)'
                }}>
                    {stats?.top_price_ranges?.map((range: any, idx: number) => (
                        <div key={idx} style={{
                            background: 'white',
                            padding: 'var(--space-lg)',
                            borderRadius: 'var(--radius-lg)',
                            border: '2px solid #E5E7EB',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '8px' }}>
                                {range.range}
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1F2937' }}>
                                {range.count}
                            </div>
                            <div style={{
                                marginTop: '8px',
                                padding: '4px 12px',
                                background: '#F3F4F6',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                color: '#6B7280'
                            }}>
                                {((range.count / stats.total_properties) * 100).toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GlobalOverview;
