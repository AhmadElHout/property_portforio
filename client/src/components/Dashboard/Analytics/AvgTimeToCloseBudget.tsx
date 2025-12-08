import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface BudgetData {
    range: string;
    avg_days: number;
    total_closed: number;
}

const AvgTimeToCloseBudget = () => {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState<BudgetData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/analytics/time-to-close/budget', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                showToast('Failed to load budget data', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch budget data:', error);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const maxDays = Math.max(...data.map(d => d.avg_days), 1);

    return (
        <div className="card">
            <h4 style={{ marginBottom: 'var(--space-md)' }}>Avg Time-to-Close by Budget</h4>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading...</div>
            ) : data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                    No closed properties with budget data
                </div>
            ) : (
                <>
                    {/* Table */}
                    <table style={{ width: '100%', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: 'var(--space-sm)' }}>Budget Range</th>
                                <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Avg Days</th>
                                <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: 'var(--space-sm)' }}>${item.range}</td>
                                    <td style={{ padding: 'var(--space-sm)', textAlign: 'right', fontWeight: 'bold' }}>{item.avg_days}</td>
                                    <td style={{ padding: 'var(--space-sm)', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.total_closed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mini Bar Chart */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <div style={{ width: '100px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    ${item.range}
                                </div>
                                <div style={{ flex: 1, height: '20px', background: '#f0f0f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            width: `${(item.avg_days / maxDays) * 100}%`,
                                            height: '100%',
                                            background: `linear-gradient(90deg, #28a745, #20c997)`,
                                            borderRadius: '4px',
                                            transition: 'width 0.3s'
                                        }}
                                    />
                                </div>
                                <div style={{ width: '50px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 'bold' }}>
                                    {item.avg_days}d
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default AvgTimeToCloseBudget;
