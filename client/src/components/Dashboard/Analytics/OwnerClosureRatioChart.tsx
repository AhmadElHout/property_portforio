import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import DonutWithText from '../../Charts/DonutWithText';


interface MonthlyData {
    month: string;
    properties_added: number;
    properties_closed: number;
    closure_ratio: number;
}

const OwnerClosureRatioChart = () => {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        fetchData();
    }, [selectedYear]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/analytics/closure-ratio?year=${selectedYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                showToast('Failed to load closure ratio data', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch closure ratio:', error);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const totalAdded = data.reduce((sum, d) => sum + d.properties_added, 0);
    const totalClosed = data.reduce((sum, d) => sum + d.properties_closed, 0);
    const overallClosureRate = totalAdded > 0 ? ((totalClosed / totalAdded) * 100).toFixed(1) : '0';

    const maxValue = Math.max(...data.map(d => Math.max(d.properties_added, d.properties_closed)), 1);

    return (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ margin: 0 }}>Monthly Closure Ratio</h3>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="input"
                    style={{ width: '120px' }}
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading...</div>
            ) : (
                <>
                    {/* KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                        <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: '#f8f9fa', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Added</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{totalAdded}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: '#f8f9fa', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Closed</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>{totalClosed}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: '#f8f9fa', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Overall Rate</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6c757d' }}>{overallClosureRate}%</div>
                        </div>
                    </div>

                    {/* Simple Bar Chart */}
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        {data.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                                No data available for {selectedYear}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
                                {data.map((item) => (
                                    <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            {(item.closure_ratio * 100).toFixed(0)}%
                                        </div>
                                        <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', height: '140px' }}>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'var(--primary)',
                                                    height: `${(item.properties_added / maxValue) * 100}%`,
                                                    minHeight: item.properties_added > 0 ? '4px' : '0',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.3s'
                                                }}
                                                title={`Added: ${item.properties_added}`}
                                            />
                                            <div
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: '#28a745',
                                                    height: `${(item.properties_closed / maxValue) * 100}%`,
                                                    minHeight: item.properties_closed > 0 ? '4px' : '0',
                                                    borderRadius: '4px 4px 0 0',
                                                    transition: 'height 0.3s'
                                                }}
                                                title={`Closed: ${item.properties_closed}`}
                                            />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {item.month.split('-')[1]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                            <span>Added</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#28a745', borderRadius: '2px' }} />
                            <span>Closed</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OwnerClosureRatioChart;
