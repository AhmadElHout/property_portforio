import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import DonutWithText from '../../Charts/DonutWithText';

interface MonthlyData {
    month: string;
    properties_added: number;
    properties_closed: number;
    closure_ratio: number;
}

const MonthNavigatorPerformance = () => {
    const { token } = useAuth();
    const [allData, setAllData] = useState<MonthlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());

    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        if (token) {
            fetchData();
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
                setAllData(result);
            }
        } catch (error) {
            console.error('Failed to fetch closure ratio:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get current month's data
    const currentMonthKey = `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, '0')}`;
    const currentMonthData = allData.find(d => d.month === currentMonthKey) || {
        month: currentMonthKey,
        properties_added: 0,
        properties_closed: 0,
        closure_ratio: 0
    };

    // Donut Data
    const closedCount = currentMonthData.properties_closed;
    const addedCount = currentMonthData.properties_added;
    const remaining = Math.max(0, addedCount - closedCount);

    // Using CSS variables as requested, with fallbacks
    const donutData = [
        { label: "Closed", value: closedCount, fill: "var(--chart-1, #ef4444)" },
        { label: "Remaining", value: remaining, fill: "var(--chart-2, #e5e7eb)" }
    ];

    const closurePercentDisplay = currentMonthData.closure_ratio
        ? (currentMonthData.closure_ratio * 100).toFixed(1) + '%'
        : '0%';

    // Bar Chart Data Calculation
    const maxCount = Math.max(...allData.map(d => Math.max(d.properties_added, d.properties_closed)), 1);

    // Navigation logic
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const maxAllowedMonth = selectedYear === currentYear ? currentMonth : 11;
    const minAllowedMonth = 0;
    const canGoPrev = selectedMonthIndex > minAllowedMonth;
    const canGoNext = selectedMonthIndex < maxAllowedMonth;

    const goToPrevMonth = () => canGoPrev && setSelectedMonthIndex(prev => prev - 1);
    const goToNextMonth = () => canGoNext && setSelectedMonthIndex(prev => prev + 1);

    return (
        <div>
            {/* Header / Year Selector */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-lg)' }}>
                <select
                    value={selectedYear}
                    onChange={(e) => {
                        setSelectedYear(Number(e.target.value));
                        setSelectedMonthIndex(0);
                    }}
                    className="input"
                    style={{ width: '140px', padding: '10px 14px', fontWeight: '500' }}
                >
                    {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>

            {/* Month Navigator */}
            <div className="card" style={{ marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-lg)', background: 'linear-gradient(to right, #ffffff, #f9fafb)' }}>
                <button
                    onClick={goToPrevMonth}
                    disabled={!canGoPrev}
                    style={{
                        background: canGoPrev ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: canGoPrev ? 'pointer' : 'not-allowed',
                        opacity: canGoPrev ? 1 : 0.5,
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ color: 'white', fontSize: '1.2rem', lineHeight: 1 }}>‹</span>
                </button>

                <div style={{ textAlign: 'center', minWidth: '200px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                        {months[selectedMonthIndex]}
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: '500' }}>
                        {selectedYear}
                    </div>
                </div>

                <button
                    onClick={goToNextMonth}
                    disabled={!canGoNext}
                    style={{
                        background: canGoNext ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: canGoNext ? 'pointer' : 'not-allowed',
                        opacity: canGoNext ? 1 : 0.5,
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ color: 'white', fontSize: '1.2rem', lineHeight: 1 }}>›</span>
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>Loading analytics...</div>
            ) : (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-lg)' }}>

                    {/* LEFT: Donut Chart Section (Month Specific) */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '16px', color: '#374151' }}>
                            {months[selectedMonthIndex]} Status
                        </h3>
                        <DonutWithText
                            data={donutData}
                            centerLabel="Closure Ratio"
                            centerValue={closurePercentDisplay}
                            size={220}
                            strokeWidth={24}
                        />
                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Properties Added: <strong>{addedCount}</strong></div>
                            <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Properties Closed: <strong>{closedCount}</strong></div>
                        </div>
                    </div>

                    {/* RIGHT: Bar Chart Section (Annual Trend) */}
                    <div className="card" style={{ padding: 'var(--space-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#374151' }}>
                                Annual Closure Trend
                            </h3>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }}></span>
                                    <span>Added</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></span>
                                    <span>Closed</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ position: 'relative', height: '300px' }}>
                            {/* Y-axis Labels */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 20, width: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9CA3AF', textAlign: 'right' }}>
                                <span>{maxCount}</span>
                                <span>{Math.round(maxCount / 2)}</span>
                                <span>0</span>
                            </div>

                            {/* Chart Area */}
                            <div style={{ position: 'absolute', left: 40, right: 0, top: 0, bottom: 0 }}>
                                <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                    {/* Grid Lines */}
                                    <line x1="0" y1="0" x2="100%" y2="0" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="4 4" />
                                    <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#E5E7EB" strokeWidth="1" />

                                    {/* Trend Line (Green) */}
                                    <polyline
                                        points={months.map((_, i) => {
                                            const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
                                            const d = allData.find(item => item.month === monthKey);
                                            const ratio = d && d.properties_added > 0 ? d.properties_closed / d.properties_added : 0;

                                            const slotWidth = 100 / 12;
                                            const x = i * slotWidth + (slotWidth / 2);
                                            const y = 100 - (ratio * 100);
                                            return `${x}%,${y}%`;
                                        }).join(' ')}
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        opacity="0.8"
                                    />

                                    {/* Mapping over fixed 12 months for X-axis stability */}
                                    {months.map((_, i) => {
                                        const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
                                        const dataItem = allData.find(d => d.month === monthKey) || { properties_added: 0, properties_closed: 0 };

                                        const slotWidth = 100 / 12;
                                        const x = i * slotWidth + (slotWidth / 2);

                                        const hAdded = (dataItem.properties_added / maxCount) * 100;
                                        const hClosed = (dataItem.properties_closed / maxCount) * 100;
                                        const ratio = dataItem.properties_added > 0 ? dataItem.properties_closed / dataItem.properties_added : 0;
                                        const ratioY = 100 - (ratio * 100);
                                        const ratioPct = (ratio * 100).toFixed(0);

                                        const isSelected = i === selectedMonthIndex;

                                        return (
                                            <g key={i}>
                                                {/* Active Month Highlight Background */}
                                                {isSelected && (
                                                    <rect
                                                        x={`${i * slotWidth}%`}
                                                        y="-10"
                                                        width={`${slotWidth}%`}
                                                        height="110%"
                                                        fill="#F3F4F6"
                                                        rx="4"
                                                    />
                                                )}

                                                {/* Added Bar */}
                                                {dataItem.properties_added > 0 && (
                                                    <rect
                                                        x={`${x - 2}%`}
                                                        y={`${100 - hAdded}%`}
                                                        width="2%"
                                                        height={`${hAdded}%`}
                                                        fill="#3b82f6"
                                                        rx="2"
                                                    />
                                                )}

                                                {/* Closed Bar */}
                                                {dataItem.properties_closed > 0 && (
                                                    <rect
                                                        x={`${x + 0.5}%`}
                                                        y={`${100 - hClosed}%`}
                                                        width="2%"
                                                        height={`${hClosed}%`}
                                                        fill="#ef4444"
                                                        rx="2"
                                                    />
                                                )}

                                                {/* Ratio Label */}
                                                {dataItem.properties_added > 0 && (
                                                    <text
                                                        x={`${x}%`}
                                                        y={`${Math.max(ratioY - 5, 5)}%`}
                                                        textAnchor="middle"
                                                        fontSize="10"
                                                        fill="#10b981"
                                                        fontWeight="bold"
                                                    >
                                                        {ratioPct}%
                                                    </text>
                                                )}

                                                {/* Ratio Point */}
                                                <circle
                                                    cx={`${x}%`}
                                                    cy={`${ratioY}%`}
                                                    r="3"
                                                    fill="#10b981"
                                                    stroke="white"
                                                    strokeWidth="1.5"
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>
                                {/* Labels outside SVG to avoid clipping or use <svg overflow="visible"> */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingLeft: '2%', paddingRight: '2%' }}>
                                    {monthsShort.map((m, i) => (
                                        <div key={i} style={{ width: `${100 / 12}%`, textAlign: 'center', fontSize: '0.7rem', color: i === selectedMonthIndex ? '#111827' : '#9CA3AF', fontWeight: i === selectedMonthIndex ? 'bold' : 'normal' }}>
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles */}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default MonthNavigatorPerformance;
