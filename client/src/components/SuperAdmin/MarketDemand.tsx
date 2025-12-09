import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const MarketDemand = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>({ top_areas: [], demand_by_budget: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/superadmin/market-demand', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch market demand:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;

    const maxLeads = Math.max(...stats.top_areas.map((a: any) => a.count), 1);

    return (
        <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: 'var(--space-xl)', color: '#1F2937' }}>
                🔥 Market Demand Analysis
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: 'var(--space-xl)' }}>
                {/* Hot Areas Heatmap/List */}
                <div style={{ background: 'white', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '24px', color: '#374151' }}>
                        🗺️ High Demand Locations (Heatmap)
                    </h3>
                    {stats.top_areas.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {stats.top_areas.map((area: any, idx: number) => (
                                <div key={idx} style={{ position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.9rem', fontWeight: '600' }}>
                                        <span>{area.area}</span>
                                        <span>{area.count} Leads</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '16px',
                                        background: '#F3F4F6',
                                        borderRadius: '99px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(area.count / maxLeads) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #ec4899 0%, #be185d 100%)',
                                            borderRadius: '99px'
                                        }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No lead data to generate heatmap</p>
                    )}
                </div>

                {/* Budget Preferences */}
                <div style={{ background: 'white', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '24px', color: '#374151' }}>
                        💰 Top Budget Ranges
                    </h3>
                    {stats.demand_by_budget.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {stats.demand_by_budget.map((range: any, idx: number) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    background: idx === 0 ? '#EFF6FF' : '#F9FAFB',
                                    borderRadius: 'var(--radius-md)',
                                    border: idx === 0 ? '1px solid #BFDBFE' : '1px solid #E5E7EB'
                                }}>
                                    <span style={{ fontWeight: '500', color: idx === 0 ? '#1E40AF' : '#374151' }}>
                                        {range.range}
                                    </span>
                                    <span style={{
                                        background: idx === 0 ? '#3b82f6' : '#9CA3AF',
                                        color: 'white',
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {range.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#9CA3AF', textAlign: 'center' }}>No budget data available</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketDemand;
