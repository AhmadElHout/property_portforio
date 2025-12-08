import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface TopLocation {
    area: string;
    lead_count: number;
}

interface TopSpec {
    property_type: string;
    budget_range: string;
    age_range: string;
    lead_count: number;
}

interface FarmingData {
    top_locations: TopLocation[];
    top_specs: TopSpec[];
    recommendations: string[];
}

const PropertyFarmingRecommendations = () => {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState<FarmingData>({
        top_locations: [],
        top_specs: [],
        recommendations: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/api/analytics/farming-recommendations', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                showToast('Failed to load farming recommendations', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch farming recommendations:', error);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const maxLocationLeads = Math.max(...data.top_locations.map(l => l.lead_count), 1);
    const maxSpecLeads = Math.max(...data.top_specs.map(s => s.lead_count), 1);

    return (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>🎯 Property Farming Recommendations</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                Strategic insights on where your agents should focus this month
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                    {/* Top Locations */}
                    <div>
                        <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', color: 'var(--primary)' }}>
                            📍 Top Locations by Demand
                        </h4>
                        {data.top_locations.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', padding: 'var(--space-md)' }}>No location data available</p>
                        ) : (
                            <>
                                {/* Chart */}
                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    {data.top_locations.map((location, idx) => (
                                        <div key={idx} style={{ marginBottom: 'var(--space-sm)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.875rem' }}>
                                                <span style={{ fontWeight: 'bold' }}>{location.area}</span>
                                                <span style={{ color: 'var(--primary)' }}>{location.lead_count} leads</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        width: `${(location.lead_count / maxLocationLeads) * 100}%`,
                                                        height: '100%',
                                                        background: idx === 0 ? '#dc3545' : idx === 1 ? '#fd7e14' : 'var(--primary)',
                                                        transition: 'width 0.3s'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Table */}
                                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                            <th style={{ padding: 'var(--space-sm)' }}>#</th>
                                            <th style={{ padding: 'var(--space-sm)' }}>Location</th>
                                            <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Leads</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.top_locations.map((location, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: 'var(--space-sm)' }}>{idx + 1}</td>
                                                <td style={{ padding: 'var(--space-sm)' }}>{location.area}</td>
                                                <td style={{ padding: 'var(--space-sm)', textAlign: 'right', fontWeight: 'bold' }}>
                                                    {location.lead_count}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>

                    {/* Top Specs */}
                    <div>
                        <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', color: 'var(--primary)' }}>
                            🏠 Top Property Specifications
                        </h4>
                        {data.top_specs.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', padding: 'var(--space-md)' }}>No specs data available</p>
                        ) : (
                            <>
                                {/* Chart */}
                                <div style={{ marginBottom: 'var(--space-md)' }}>
                                    {data.top_specs.map((spec, idx) => (
                                        <div key={idx} style={{ marginBottom: 'var(--space-sm)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.875rem' }}>
                                                <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                    {spec.property_type} • ${spec.budget_range}
                                                </span>
                                                <span style={{ color: 'var(--primary)' }}>{spec.lead_count} leads</span>
                                            </div>
                                            <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div
                                                    style={{
                                                        width: `${(spec.lead_count / maxSpecLeads) * 100}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, #28a745, #20c997)',
                                                        transition: 'width 0.3s'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Table */}
                                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                            <th style={{ padding: 'var(--space-sm)' }}>#</th>
                                            <th style={{ padding: 'var(--space-sm)' }}>Spec</th>
                                            <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Leads</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.top_specs.map((spec, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: 'var(--space-sm)' }}>{idx + 1}</td>
                                                <td style={{ padding: 'var(--space-sm)', textTransform: 'capitalize' }}>
                                                    {spec.property_type} • ${spec.budget_range} • {spec.age_range}
                                                </td>
                                                <td style={{ padding: 'var(--space-sm)', textAlign: 'right', fontWeight: 'bold' }}>
                                                    {spec.lead_count}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>

                    {/* Recommendations */}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem', color: 'var(--primary)' }}>
                            💡 Areas Your Agents Should Farm This Month
                        </h4>
                        <div
                            style={{
                                padding: 'var(--space-lg)',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 'var(--radius-md)',
                                color: 'white'
                            }}
                        >
                            {data.recommendations.length === 0 ? (
                                <p>No recommendations available</p>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {data.recommendations.map((rec, idx) => (
                                        <li
                                            key={idx}
                                            style={{
                                                marginBottom: idx < data.recommendations.length - 1 ? 'var(--space-md)' : 0,
                                                paddingLeft: 'var(--space-md)',
                                                position: 'relative',
                                                fontSize: '1rem',
                                                lineHeight: '1.6'
                                            }}
                                        >
                                            <span style={{ position: 'absolute', left: 0 }}>✓</span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyFarmingRecommendations;
