import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const TimeToCloseInsights = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>({ by_location: [], by_budget: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/superadmin/time-to-close', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch time-to-close stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px' }}>
                <div className="spinner"></div>
                <p style={{ color: '#6B7280', marginTop: '16px' }}>Analyzing historical data...</p>
                <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: 'var(--space-xl)', color: '#1F2937' }}>
                ⏱️ Average Time-to-Close Analytics
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)' }}>
                {/* By Location */}
                <div style={{ background: 'white', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: '#374151' }}>
                        📍 By Location
                    </h3>
                    {stats.by_location.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F9FAFB', color: '#6B7280', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Location</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Avg Days</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Speed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.by_location.map((item: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.category}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.avg_days}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '99px',
                                                fontSize: '0.75rem',
                                                background: item.avg_days < 30 ? '#DCFCE7' : item.avg_days < 60 ? '#FEF3C7' : '#FEE2E2',
                                                color: item.avg_days < 30 ? '#166534' : item.avg_days < 60 ? '#92400E' : '#991B1B',
                                                fontWeight: '600'
                                            }}>
                                                {item.avg_days < 30 ? 'Fast' : item.avg_days < 60 ? 'Medium' : 'Slow'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '20px' }}>No location data available</p>
                    )}
                </div>

                {/* By Budget */}
                <div style={{ background: 'white', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: '#374151' }}>
                        💰 By Budget Range
                    </h3>
                    {stats.by_budget.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F9FAFB', color: '#6B7280', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Range</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Avg Days</th>
                                    <th style={{ padding: '12px', textAlign: 'center' }}>Speed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.by_budget.map((item: any, idx: number) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.category}</td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.avg_days}</td>
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '99px',
                                                fontSize: '0.75rem',
                                                background: item.avg_days < 30 ? '#DCFCE7' : item.avg_days < 60 ? '#FEF3C7' : '#FEE2E2',
                                                color: item.avg_days < 30 ? '#166534' : item.avg_days < 60 ? '#92400E' : '#991B1B',
                                                fontWeight: '600'
                                            }}>
                                                {item.avg_days < 30 ? 'Fast' : item.avg_days < 60 ? 'Medium' : 'Slow'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '20px' }}>No budget data available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimeToCloseInsights;
