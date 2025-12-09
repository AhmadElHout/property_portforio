import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface Recommendation {
    area: string;
    leads: number;
    avg_time_to_close: string;
    trend: string;
    score: number;
}

const FarmingRecommendations = () => {
    const { token } = useAuth();
    const [recs, setRecs] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/superadmin/farming-recommendations', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRecs(data);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;

    return (
        <div>
            <div style={{
                background: 'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
                color: 'white',
                padding: 'var(--space-xl)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-xl)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        🎯 Strategic Farming Recommendations
                    </h2>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                        Based on platform-wide lead volume and closure velocity.
                        Advise agencies to focus their farming efforts here.
                    </p>
                </div>
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '300px',
                    height: '300px',
                    background: 'white',
                    opacity: 0.05,
                    borderRadius: '50%'
                }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                {recs.map((rec, idx) => (
                    <div key={idx} style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #E5E7EB',
                        padding: 'var(--space-xl)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {idx === 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: '#F59E0B',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '99px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}>
                                #1 OPPORTUNITY
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937' }}>{rec.area}</h3>
                            <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>Score: {rec.score}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{
                                background: '#F3F4F6',
                                padding: '12px',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>Lead Volume</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>{rec.leads}</div>
                            </div>

                            <div style={{
                                background: '#F3F4F6',
                                padding: '12px',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>Closure Vel.</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>{rec.avg_time_to_close}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Monthly Trend:</span>
                            <span style={{
                                color: rec.trend.startsWith('+') ? '#10b981' : '#ef4444',
                                fontWeight: 'bold',
                                background: rec.trend.startsWith('+') ? '#DCFCE7' : '#FEE2E2',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.875rem'
                            }}>
                                {rec.trend}
                            </span>
                        </div>
                    </div>
                ))}

                {recs.length === 0 && (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                        Processing farming data across databases...
                    </p>
                )}
            </div>
        </div>
    );
};

export default FarmingRecommendations;
