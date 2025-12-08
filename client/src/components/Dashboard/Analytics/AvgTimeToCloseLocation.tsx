import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface LocationData {
    location: string;
    avg_days: number;
    total_closed: number;
}

const AvgTimeToCloseLocation = () => {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/analytics/time-to-close/location', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                showToast('Failed to load location data', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch location data:', error);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const maxDays = Math.max(...data.map(d => d.avg_days), 1);

    return (
        <div className="card">
            <h4 style={{ marginBottom: 'var(--space-md)' }}>Avg Time-to-Close by Location</h4>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading...</div>
            ) : data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                    No closed properties with location data
                </div>
            ) : (
                <>
                    {/* Table */}
                    <table style={{ width: '100%', marginBottom: 'var(--space-md)', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: 'var(--space-sm)' }}>Location</th>
                                <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Avg Days</th>
                                <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: 'var(--space-sm)' }}>{item.location}</td>
                                    <td style={{ padding: 'var(--space-sm)', textAlign: 'right', fontWeight: 'bold' }}>{item.avg_days}</td>
                                    <td style={{ padding: 'var(--space-sm)', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.total_closed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Mini Bar Chart */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.slice(0, 5).map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <div style={{ width: '100px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {item.location.substring(0, 12)}
                                </div>
                                <div style={{ flex: 1, height: '20px', background: '#f0f0f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            width: `${(item.avg_days / maxDays) * 100}%`,
                                            height: '100%',
                                            background: `linear-gradient(90deg, var(--primary), #6c5ce7)`,
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

export default AvgTimeToCloseLocation;
