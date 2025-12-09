import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AgencyStats {
    database: string;
    properties_count: number;
    closed_count: number;
    agents_count: number;
    avg_closure_time: number;
    score: number;
}

const AgenciesComparison = () => {
    const { token } = useAuth();
    const [agencies, setAgencies] = useState<AgencyStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        setLoading(true);
        try {
            // Fetch global stats to determine agencies
            const response = await fetch('http://localhost:3000/api/superadmin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const stats = await response.json();

                // Simulate agency-specific data (you would fetch this from separate endpoints)
                const agencyData: AgencyStats[] = stats.databases?.map((db: string, idx: number) => ({
                    database: db,
                    properties_count: stats.total_properties || 0,
                    closed_count: stats.total_closed || 0,
                    agents_count: stats.total_agents || 0,
                    avg_closure_time: Math.floor(Math.random() * 30) + 15, // days (mock)
                    score: calculateScore(stats.total_properties, stats.total_closed, stats.total_agents)
                })) || [];

                setAgencies(agencyData.sort((a, b) => b.score - a.score));
            }
        } catch (error) {
            console.error('Failed to fetch agencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateScore = (props: number, closed: number, agents: number) => {
        const closureRate = props > 0 ? (closed / props) * 100 : 0;
        const propsPerAgent = agents > 0 ? props / agents : 0;
        return Math.round(closureRate * 0.6 + propsPerAgent * 0.4);
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
                <p style={{ color: '#6B7280' }}>Loading agencies comparison...</p>
            </div>
        );
    }

    const maxScore = Math.max(...agencies.map(a => a.score), 1);

    return (
        <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: 'var(--space-xl)', color: '#1F2937' }}>
                📊 Agencies Performance Ranking
            </h2>

            {/* Agencies Table */}
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
                marginBottom: 'var(--space-xl)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Rank</th>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Agency</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Properties</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Closed</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Agents</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Avg Close Time</th>
                            <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {agencies.map((agency, idx) => (
                            <tr key={idx} style={{
                                background: idx % 2 === 0 ? 'white' : '#F9FAFB',
                                borderBottom: '1px solid #E5E7EB'
                            }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: idx === 0 ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' :
                                            idx === 1 ? 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)' :
                                                idx === 2 ? 'linear-gradient(135deg, #cd7f32 0%, #e8a87c 100%)' :
                                                    '#E5E7EB',
                                        color: idx < 3 ? '#1F2937' : '#6B7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '0.875rem'
                                    }}>
                                        {idx + 1}
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: '600', color: '#374151' }}>
                                    {agency.database.replace('_', ' ').toUpperCase()}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center', color: '#1F2937' }}>
                                    {agency.properties_count}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '4px 12px',
                                        background: '#DCFCE7',
                                        color: '#166534',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: '600'
                                    }}>
                                        {agency.closed_count}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center', color: '#1F2937' }}>
                                    {agency.agents_count}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center', color: '#6B7280' }}>
                                    {agency.avg_closure_time} days
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '6px 16px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 'bold',
                                        fontSize: '1rem'
                                    }}>
                                        {agency.score}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Visual Comparison */}
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 'var(--space-lg)', color: '#1F2937' }}>
                📈 Performance Comparison
            </h3>
            <div style={{
                background: '#F9FAFB',
                padding: 'var(--space-xl)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #E5E7EB'
            }}>
                {agencies.map((agency, idx) => (
                    <div key={idx} style={{ marginBottom: 'var(--space-lg)' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                        }}>
                            <span style={{ fontWeight: '600', color: '#374151' }}>
                                {agency.database.replace('_', ' ').toUpperCase()}
                            </span>
                            <span style={{ color: '#6B7280' }}>
                                Score: <strong style={{ color: '#1F2937' }}>{agency.score}</strong>
                            </span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '24px',
                            background: '#E5E7EB',
                            borderRadius: '999px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(agency.score / maxScore) * 100}%`,
                                height: '100%',
                                background: idx === 0 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' :
                                    idx === 1 ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)' :
                                        'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                                borderRadius: '999px',
                                transition: 'width 0.5s ease'
                            }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgenciesComparison;
