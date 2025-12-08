import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DonutWithText from './DonutWithText';

interface MonthlyData {
    month: string;
    properties_added: number;
    properties_closed: number;
    closure_ratio: number;
}

interface PropertyStatusData {
    status: string;
    count: number;
}

const MonthlyClosureRatioChart = () => {
    const { token } = useAuth();
    const [data, setData] = useState<MonthlyData[]>([]);
    const [statusData, setStatusData] = useState<PropertyStatusData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        if (token) {
            fetchData();
            fetchStatusData();
        }
    }, [selectedYear, token]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3000/api/analytics/closure-ratio?year=${selectedYear}`, {
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

    const fetchStatusData = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/analytics/property-status-distribution', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setStatusData(result);
            }
        } catch (error) {
            console.error('Failed to fetch status distribution:', error);
        }
    };

    const totalAdded = data.reduce((sum, d) => sum + d.properties_added, 0);
    const totalClosed = data.reduce((sum, d) => sum + d.properties_closed, 0);
    const overallClosureRate = totalAdded > 0 ? ((totalClosed / totalAdded) * 100).toFixed(1) : '0.0';

    const maxCount = Math.max(...data.map(d => Math.max(d.properties_added, d.properties_closed)), 1);
    const maxRatio = 100; // Fixed to 100% for percentage scale

    const getMonthLabel = (monthStr: string) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = parseInt(monthStr.split('-')[1]) - 1;
        return months[month];
    };

    // Transform status data for donut
    const statusColors: Record<string, string> = {
        'active': '#3B82F6',
        'in_progress': '#22C55E',
        'closed': '#F97316',
        'on_hold': '#EF4444',
        'archived': '#A855F7'
    };

    const donutData = statusData.map(item => ({
        label: item.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: item.count
    }));

    const totalProperties = statusData.reduce((sum, item) => sum + item.count, 0);

    return (
        <div>
            {/* KPI Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: '#EFF6FF', borderRadius: 'var(--radius-lg)', border: '2px solid #DBEAFE' }}>
                    <div style={{ fontSize: '0.875rem', color: '#1E40AF', fontWeight: '600', marginBottom: '8px' }}>Total Added</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{totalAdded}</div>
                </div>
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: '#FEF2F2', borderRadius: 'var(--radius-lg)', border: '2px solid #FECACA' }}>
                    <div style={{ fontSize: '0.875rem', color: '#991B1B', fontWeight: '600', marginBottom: '8px' }}>Total Closed</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{totalClosed}</div>
                </div>
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', background: '#F0FDF4', borderRadius: 'var(--radius-lg)', border: '2px solid #BBF7D0' }}>
                    <div style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '600', marginBottom: '8px' }}>Closure Rate</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{overallClosureRate}%</div>
                </div>
            </div>

            {/* Chart Card */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Monthly Performance</h3>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="input"
                        style={{ width: '140px', padding: '8px 12px' }}
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px' }}>Loading...</div>
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px', color: '#6B7280' }}>
                        No data available for {selectedYear}
                    </div>
                ) : (
                    <>
                        {/* Combo Chart */}
                        <div style={{ position: 'relative', height: '380px', marginBottom: 'var(--space-lg)' }}>
                            {/* Y-axis labels for bars (left) */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 60, width: '45px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6B7280', textAlign: 'right', paddingRight: '8px' }}>
                                <span style={{ fontWeight: '500' }}>{maxCount}</span>
                                <span>{Math.round(maxCount * 0.75)}</span>
                                <span>{Math.round(maxCount * 0.5)}</span>
                                <span>{Math.round(maxCount * 0.25)}</span>
                                <span>0</span>
                            </div>

                            {/* Y-axis labels for ratio (right) */}
                            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 60, width: '45px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.75rem', color: '#10b981', textAlign: 'left', paddingLeft: '8px', fontWeight: '500' }}>
                                <span>100%</span>
                                <span>75%</span>
                                <span>50%</span>
                                <span>25%</span>
                                <span>0%</span>
                            </div>

                            {/* Chart area */}
                            <div style={{ position: 'absolute', left: 55, right: 55, top: 0, bottom: 0 }}>
                                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                    {/* Grid lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                                        <line
                                            key={i}
                                            x1="0"
                                            y1={`${(1 - ratio) * 320}`}
                                            x2="100%"
                                            y2={`${(1 - ratio) * 320}`}
                                            stroke="#E5E7EB"
                                            strokeWidth="1.5"
                                            opacity="0.6"
                                        />
                                    ))}

                                    {/* Bars and data */}
                                    {data.map((item, index) => {
                                        const barWidth = 100 / data.length;
                                        const centerX = (index * barWidth) + (barWidth / 2);
                                        const barItemWidth = Math.min(barWidth / 3.5, 8);
                                        const closurePercent = item.properties_added > 0
                                            ? ((item.properties_closed / item.properties_added) * 100).toFixed(1)
                                            : '0.0';

                                        return (
                                            <g key={index}>
                                                {/* Added bar (Blue) */}
                                                <rect
                                                    x={`${centerX - barItemWidth * 1.2}%`}
                                                    y={320 - (item.properties_added / maxCount) * 320}
                                                    width={`${barItemWidth}%`}
                                                    height={(item.properties_added / maxCount) * 320}
                                                    fill="#3b82f6"
                                                    rx="4"
                                                />

                                                {/* Closed bar (Red) */}
                                                <rect
                                                    x={`${centerX + barItemWidth * 0.2}%`}
                                                    y={320 - (item.properties_closed / maxCount) * 320}
                                                    width={`${barItemWidth}%`}
                                                    height={(item.properties_closed / maxCount) * 320}
                                                    fill="#ef4444"
                                                    rx="4"
                                                />

                                                {/* Closure % label above red bar */}
                                                <text
                                                    x={`${centerX + barItemWidth * 0.7}%`}
                                                    y={Math.max(320 - (item.properties_closed / maxCount) * 320 - 8, 15)}
                                                    textAnchor="middle"
                                                    fontSize="11"
                                                    fill="#10b981"
                                                    fontWeight="700"
                                                >
                                                    {closurePercent}%
                                                </text>

                                                {/* Month label */}
                                                <text
                                                    x={`${centerX}%`}
                                                    y="345"
                                                    textAnchor="middle"
                                                    fontSize="12"
                                                    fill="#374151"
                                                    fontWeight="500"
                                                >
                                                    {getMonthLabel(item.month)}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* Closure ratio line (Green) */}
                                    <polyline
                                        points={data.map((item, index) => {
                                            const barWidth = 100 / data.length;
                                            const x = (index * barWidth) + (barWidth / 2);
                                            const closureRatio = item.properties_added > 0
                                                ? (item.properties_closed / item.properties_added)
                                                : 0;
                                            const y = 320 - (closureRatio * 320);
                                            return `${x}%,${y}`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Ratio points */}
                                    {data.map((item, index) => {
                                        const barWidth = 100 / data.length;
                                        const x = (index * barWidth) + (barWidth / 2);
                                        const closureRatio = item.properties_added > 0
                                            ? (item.properties_closed / item.properties_added)
                                            : 0;
                                        const y = 320 - (closureRatio * 320);

                                        return (
                                            <circle
                                                key={`point-${index}`}
                                                cx={`${x}%`}
                                                cy={y}
                                                r="5"
                                                fill="#10b981"
                                                stroke="white"
                                                strokeWidth="3"
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)', fontSize: '0.875rem', paddingTop: 'var(--space-md)', borderTop: '1px solid #E5E7EB' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '18px', height: '18px', backgroundColor: '#3b82f6', borderRadius: '4px' }} />
                                <span style={{ fontWeight: '500' }}>Properties Added</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '18px', height: '18px', backgroundColor: '#ef4444', borderRadius: '4px' }} />
                                <span style={{ fontWeight: '500' }}>Properties Closed</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '18px', height: '4px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                                <span style={{ fontWeight: '500' }}>Closure Ratio (%)</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Property Status Distribution Donut */}
            {statusData.length > 0 && (
                <div className="card">
                    <h3 style={{ margin: 0, marginBottom: 'var(--space-lg)', fontSize: '1.25rem' }}>Property Status Distribution</h3>
                    <DonutWithText
                        data={donutData}
                        centerLabel="Properties"
                        size={240}
                        strokeWidth={28}
                    />
                </div>
            )}
        </div>
    );
};

export default MonthlyClosureRatioChart;
