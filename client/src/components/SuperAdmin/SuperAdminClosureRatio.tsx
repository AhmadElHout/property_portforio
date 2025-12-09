import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

interface MonthlyData {
    month: string;
    properties_added: number;
    properties_closed: number;
    closure_ratio: number;
}

const SuperAdminClosureRatio = () => {
    const { token } = useAuth();
    const [data, setData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [selectedYear, token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/superadmin/closure-ratio?year=${selectedYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Failed to fetch closure ratio:', error);
        } finally {
            setLoading(false);
        }
    };

    const bestMonth = data.reduce((max, m) => m.closure_ratio > max.closure_ratio ? m : max, data[0] || {});
    const worstMonth = data.reduce((min, m) => m.closure_ratio > 0 && m.closure_ratio < min.closure_ratio ? m : min, data[0] || {});

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1F2937' }}>
                    📊 Monthly Closure Ratio (Platform-Wide)
                </h2>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="input"
                    style={{ width: '150px', padding: '10px 14px' }}
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {loading ? (
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
                </div>
            ) : (
                <>
                    {/* Highlights */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-lg)',
                        marginBottom: 'var(--space-xl)'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            padding: 'var(--space-xl)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'white'
                        }}>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>🏆 Best Month</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                {bestMonth ? months[parseInt(bestMonth.month?.split('-')[1]) - 1] : 'N/A'}
                            </div>
                            <div style={{ fontSize: '1.25rem', marginTop: '8px' }}>
                                {bestMonth ? `${(bestMonth.closure_ratio * 100).toFixed(1)}%` : '-'}
                            </div>
                        </div>

                        <div style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            padding: 'var(--space-xl)',
                            borderRadius: 'var(--radius-lg)',
                            color: 'white'
                        }}>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '8px' }}>⚠️ Needs Attention</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                                {worstMonth ? months[parseInt(worstMonth.month?.split('-')[1]) - 1] : 'N/A'}
                            </div>
                            <div style={{ fontSize: '1.25rem', marginTop: '8px' }}>
                                {worstMonth ? `${(worstMonth.closure_ratio * 100).toFixed(1)}%` : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Monthly Data Table */}
                    <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Month</th>
                                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Added</th>
                                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Closed</th>
                                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Closure %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((month, idx) => (
                                    <tr key={idx} style={{
                                        background: idx % 2 === 0 ? 'white' : '#F9FAFB',
                                        borderBottom: '1px solid #E5E7EB'
                                    }}>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#1F2937' }}>
                                            {months[parseInt(month.month.split('-')[1]) - 1]} {selectedYear}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center', color: '#3b82f6', fontWeight: '600' }}>
                                            {month.properties_added}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                                            {month.properties_closed}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '6px 16px',
                                                background: month.closure_ratio > 0.5 ? '#DCFCE7' : month.closure_ratio > 0.3 ? '#FEF3C7' : '#FEE2E2',
                                                color: month.closure_ratio > 0.5 ? '#166534' : month.closure_ratio > 0.3 ? '#92400E' : '#991B1B',
                                                borderRadius: 'var(--radius-md)',
                                                fontWeight: '700'
                                            }}>
                                                {(month.closure_ratio * 100).toFixed(1)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default SuperAdminClosureRatio;
