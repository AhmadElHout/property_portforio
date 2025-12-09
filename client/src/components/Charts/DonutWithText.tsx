import React from 'react';

interface DonutDataItem {
    label: string;
    value: number;
    fill?: string;
}

interface DonutWithTextProps {
    data: DonutDataItem[];
    centerLabel?: string;
    centerValue?: string | number;
    size?: number;
    strokeWidth?: number;
}

const DonutWithText: React.FC<DonutWithTextProps> = ({
    data,
    centerLabel = 'Total',
    centerValue,
    size = 200,
    strokeWidth = 20,
}) => {
    // Custom color palette
    const palette = [
        '#3b82f6',  // Blue
        '#10b981',  // Green
        '#f59e0b',  // Amber
        '#ef4444',  // Red
        '#8b5cf6',  // Purple
        '#06b6d4',  // Cyan
        '#ec4899'   // Pink
    ];

    const total = React.useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.value, 0);
    }, [data]);

    const radius = (size - strokeWidth) / 2;
    const center = size / 2;

    // Calculate segments with percentages
    const segments = data.map((item, index) => ({
        ...item,
        color: item.fill || palette[index % palette.length],
        percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));

    return (
        <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                {/* Donut Chart */}
                <div style={{ position: 'relative', width: size, height: size }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        {/* Background circle */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth={strokeWidth}
                        />

                        {/* Segments */}
                        {segments.map((segment, index) => {
                            const segmentRadius = radius - strokeWidth / 2;
                            const segmentCircumference = 2 * Math.PI * segmentRadius;
                            const percentage = total > 0 ? segment.value / total : 0;

                            return (
                                <circle
                                    key={index}
                                    cx={center}
                                    cy={center}
                                    r={segmentRadius}
                                    fill="none"
                                    stroke={segment.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${percentage * segmentCircumference} ${segmentCircumference}`}
                                    strokeDashoffset={-segments.slice(0, index).reduce((sum, s) =>
                                        sum + ((total > 0 ? s.value / total : 0) * segmentCircumference), 0
                                    )}
                                    style={{
                                        transform: 'rotate(-90deg)',
                                        transformOrigin: 'center',
                                        transition: 'all 0.5s ease'
                                    }}
                                />
                            );
                        })}
                    </svg>

                    {/* Center text */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1F2937', fontFamily: 'Inter, sans-serif', lineHeight: '1' }}>
                            {centerValue !== undefined ? centerValue : total}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: '#6B7280', marginTop: '8px', fontFamily: 'Inter, sans-serif', fontWeight: '500' }}>
                            {centerLabel}
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                background: '#F9FAFB',
                                borderRadius: '8px',
                                fontFamily: 'Inter, sans-serif',
                                border: '1px solid #E5E7EB'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div
                                    style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '3px',
                                        backgroundColor: segment.color
                                    }}
                                />
                                <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '500' }}>
                                    {segment.label}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#111827' }}>
                                    {segment.value}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#6B7280', minWidth: '45px', textAlign: 'right', fontWeight: '600' }}>
                                    {segment.percentage}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DonutWithText;
