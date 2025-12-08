import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

interface HotPreference {
    area: string;
    budget_range: string;
    age_range: string;
    property_type: string;
    lead_count: number;
}

const HotPreferencesDashboard = () => {
    const { token } = useAuth();
    const { showToast } = useToast();
    const [data, setData] = useState<HotPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        area: '',
        budget_range: '',
        age_range: '',
        property_type: ''
    });

    // Extract unique values for filter dropdowns
    const uniqueAreas = Array.from(new Set(data.map(d => d.area))).sort();
    const budgetRanges = ['0-100k', '100-200k', '200-300k', '300-500k', '500k+'];
    const ageRanges = ['0-5 years', '5-10 years', '10-20 years', '20+ years'];
    const propertyTypes = ['apartment', 'villa', 'office', 'land', 'store'];

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.area) params.append('area', filters.area);
            if (filters.budget_range) params.append('budget_range', filters.budget_range);
            if (filters.age_range) params.append('age_range', filters.age_range);
            if (filters.property_type) params.append('property_type', filters.property_type);

            const response = await fetch(`http://localhost:3000/api/analytics/hot-preferences?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                showToast('Failed to load hot preferences', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch hot preferences:', error);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ area: '', budget_range: '', age_range: '', property_type: '' });
    };

    const maxLeads = Math.max(...data.map(d => d.lead_count), 1);

    return (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>🔥 Hot Preferences Dashboard</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                Identify which property combinations are getting the most demand from leads
            </p>

            {/* Filters */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <select className="input" value={filters.area} onChange={(e) => handleFilterChange('area', e.target.value)}>
                    <option value="">All Areas</option>
                    {uniqueAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                    ))}
                </select>
                <select className="input" value={filters.budget_range} onChange={(e) => handleFilterChange('budget_range', e.target.value)}>
                    <option value="">All Budgets</option>
                    {budgetRanges.map(range => (
                        <option key={range} value={range}>${range}</option>
                    ))}
                </select>
                <select className="input" value={filters.age_range} onChange={(e) => handleFilterChange('age_range', e.target.value)}>
                    <option value="">All Ages</option>
                    {ageRanges.map(range => (
                        <option key={range} value={range}>{range}</option>
                    ))}
                </select>
                <select className="input" value={filters.property_type} onChange={(e) => handleFilterChange('property_type', e.target.value)}>
                    <option value="">All Types</option>
                    {propertyTypes.map(type => (
                        <option key={type} value={type} style={{ textTransform: 'capitalize' }}>{type}</option>
                    ))}
                </select>
                {Object.values(filters).some(v => v) && (
                    <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>Loading...</div>
            ) : data.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>
                    No properties with leads matching these criteria
                </div>
            ) : (
                <>
                    {/* Heatmap / Visual Bars */}
                    <div style={{ marginBottom: 'var(--space-lg)' }}>
                        {data.slice(0, 10).map((item, idx) => (
                            <div
                                key={idx}
                                style={{
                                    marginBottom: 'var(--space-sm)',
                                    padding: 'var(--space-sm)',
                                    background: '#f8f9fa',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `4px solid ${idx === 0 ? '#dc3545' : idx === 1 ? '#fd7e14' : idx === 2 ? '#ffc107' : 'var(--primary)'}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                                        {item.area} • ${item.budget_range} • {item.property_type} • {item.age_range}
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {item.lead_count} leads
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div
                                        style={{
                                            width: `${(item.lead_count / maxLeads) * 100}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--primary), #6c5ce7)',
                                            transition: 'width 0.3s'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Full Table */}
                    <table style={{ width: '100%', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: 'var(--space-sm)' }}>Rank</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Area</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Budget</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Age</th>
                                <th style={{ padding: 'var(--space-sm)' }}>Type</th>
                                <th style={{ padding: 'var(--space-sm)', textAlign: 'right' }}>Leads</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: 'var(--space-sm)', fontWeight: 'bold' }}>#{idx + 1}</td>
                                    <td style={{ padding: 'var(--space-sm)' }}>{item.area}</td>
                                    <td style={{ padding: 'var(--space-sm)' }}>${item.budget_range}</td>
                                    <td style={{ padding: 'var(--space-sm)' }}>{item.age_range}</td>
                                    <td style={{ padding: 'var(--space-sm)', textTransform: 'capitalize' }}>{item.property_type}</td>
                                    <td style={{ padding: 'var(--space-sm)', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                                        {item.lead_count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default HotPreferencesDashboard;
