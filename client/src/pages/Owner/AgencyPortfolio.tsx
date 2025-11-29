import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../../components/UI/Table';
import StatusBadge from '../../components/UI/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface Property {
    id: number;
    property_type: string;
    purpose: string;
    city: string;
    area: string;
    built_up_area: number;
    land_area: number;
    bedrooms: number;
    bathrooms: number;
    status: string;
    content_status: string;
    agent_name: string;
    price_usd: number;
    owner_name?: string;
    owner_phone?: string;
}

interface Agent {
    id: number;
    name: string;
}

const AgencyPortfolio = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        keyword: '',
        agent_id: '',
        property_type: '',
        status: '',
        content_status: '',
        city: ''
    });

    // Multi-select functionality for Super Admin requests
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [selectedProperties, setSelectedProperties] = useState<number[]>([]);

    // Fetch Agents for Dropdown
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/users', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setAgents(data.filter((u: any) => u.role === 'agent'));
                }
            } catch (error) {
                console.error('Failed to fetch agents', error);
            }
        };
        fetchAgents();
    }, [token]);

    // Fetch Properties with Filters
    const fetchProperties = async () => {
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(`http://localhost:3000/api/properties?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setProperties(data);
            }
        } catch (error) {
            console.error('Failed to fetch properties', error);
            showToast('Failed to fetch properties', 'error');
        }
    };

    const handleContentStatusChange = async (propertyId: number, newContentStatus: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/properties/${propertyId}/content-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content_status: newContentStatus })
            });

            if (response.ok) {
                setProperties(prev => prev.map(p =>
                    p.id === propertyId ? { ...p, content_status: newContentStatus } : p
                ));
                showToast(`✓ Content status changed to: ${newContentStatus.replace('_', ' ')}`, 'success');
            } else {
                const errorData = await response.json();
                showToast(`Failed: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error: any) {
            showToast(`Network error: ${error.message}`, 'error');
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [token, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const clearFilters = () => {
        setFilters({
            keyword: '',
            agent_id: '',
            property_type: '',
            status: '',
            content_status: '',
            city: ''
        });
    };

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => value && key !== 'keyword').length;

    // Multi-select handlers
    const toggleMultiSelectMode = () => {
        setMultiSelectMode(!multiSelectMode);
        setSelectedProperties([]); // Clear selection when toggling mode
    };

    const handlePropertySelect = (propertyId: number) => {
        if (selectedProperties.includes(propertyId)) {
            setSelectedProperties(selectedProperties.filter(id => id !== propertyId));
        } else {
            setSelectedProperties([...selectedProperties, propertyId]);
        }
    };

    const handleRequestSuperAdmin = async () => {
        if (selectedProperties.length === 0) {
            showToast('Please select at least one property', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/requests/super-admin-handling', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ property_ids: selectedProperties })
            });

            if (response.ok) {
                const result = await response.json();
                showToast(`✓ Super Admin handling requested for ${result.property_count} properties`, 'success');
                setSelectedProperties([]);
                setMultiSelectMode(false);
            } else {
                const error = await response.json();
                showToast(`Failed: ${error.message}`, 'error');
            }
        } catch (error: any) {
            showToast(`Network error: ${error.message}`, 'error');
        }
    };

    const columns = [
        {
            header: '',
            accessor: (item: Property) => (
                multiSelectMode ? (
                    <input
                        type="checkbox"
                        checked={selectedProperties.includes(item.id)}
                        onChange={() => handlePropertySelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <></>
                )
            )
        },
        {
            header: 'Ref #',
            accessor: (item: Property) => (
                <span className="font-medium">#{item.id}</span>
            )
        },
        {
            header: 'Image',
            accessor: (item: any) => item.thumbnail ? (
                <img
                    src={`http://localhost:3000/${item.thumbnail}`}
                    alt="Thumbnail"
                    style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        boxShadow: '2px 2px 6px rgba(0,0,0,0.2)'
                    }}
                    title="Selected thumbnail"
                />
            ) : (
                <div style={{ width: '50px', height: '50px', backgroundColor: '#eee', borderRadius: '4px' }} />
            )
        },
        { header: 'Type', accessor: 'property_type' as keyof Property },
        { header: 'Purpose', accessor: 'purpose' as keyof Property },
        { header: 'City', accessor: 'city' as keyof Property },
        { header: 'Area', accessor: 'area' as keyof Property },
        {
            header: 'Specs',
            accessor: (item: Property) => (
                <span>
                    {item.bedrooms} Bed / {item.bathrooms} Bath / {item.built_up_area || item.land_area} m²
                </span>
            )
        },
        { header: 'Price ($)', accessor: (item: Property) => item.price_usd.toLocaleString() },
        {
            header: 'Status',
            accessor: (item: Property) => (
                <StatusBadge status={item.status as any} />
            )
        },
        {
            header: 'Content',
            accessor: (item: Property) => (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (user?.role === 'owner' && item.content_status !== 'needs_fix') {
                            setSelectedPropertyId(item.id);
                            setIsStatusModalOpen(true);
                        }
                    }}
                    style={{
                        cursor: user?.role === 'owner' && item.content_status !== 'needs_fix' ? 'pointer' : 'default'
                    }}
                >
                    <StatusBadge status={item.content_status as any} />
                </div>
            )
        },
        {
            header: 'Client',
            accessor: (item: Property) => (
                <div style={{ fontSize: '0.875rem' }}>
                    {item.owner_name ? (
                        <>
                            <div className="font-medium">{item.owner_name}</div>
                            <div className="text-secondary">{item.owner_phone}</div>
                        </>
                    ) : (
                        <span className="text-secondary">—</span>
                    )}
                </div>
            )
        },
        { header: 'Agent', accessor: 'agent_name' as keyof Property },
        {
            header: '',
            accessor: (item: Property) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/properties/${item.id}`, { state: { from: '/owner/portfolio' } });
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem'
                    }}
                    title="Edit Property & View Notes"
                >
                    🖊️
                </button>
            )
        }
    ];

    return (
        <div>
            <h1 style={{ marginBottom: 'var(--space-lg)' }}>Agency Portfolio</h1>
            {/* Multi-Select Toolbar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>

                {/* Toggle Multi-Select Mode */}
                <button
                    className="btn btn-secondary"
                    onClick={toggleMultiSelectMode}
                >
                    {multiSelectMode && selectedProperties.length > 0
                        ? 'Cancel Selection'
                        : 'Select Properties'}
                </button>


                {/* Send to Super Admin Button */}
                {multiSelectMode && selectedProperties.length > 0 && (
                    <button
                        className="btn"
                        style={{
                            backgroundColor: 'gold',
                            color: 'black',
                            fontWeight: '600'
                        }}
                        onClick={handleRequestSuperAdmin}
                    >
                        📤 Send to Super Admin
                    </button>
                )}
            </div>


            {/* Toolbar: Filter Button & Search */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                <button
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="btn btn-secondary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="badge" style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            borderRadius: 'var(--radius-full)',
                            padding: '2px 8px',
                            fontSize: '0.75rem'
                        }}>
                            {activeFilterCount}
                        </span>
                    )}
                    <span>{filtersExpanded ? '▲' : '▼'}</span>
                </button>
                <div style={{ flex: 1 }}>
                    <input
                        className="input"
                        name="keyword"
                        value={filters.keyword}
                        onChange={handleFilterChange}
                        placeholder="Search by reference number, price, owner name, or phone last 4 digits..."
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {filtersExpanded && (
                <div className="card fade-in" style={{ marginBottom: 'var(--space-lg)', marginTop: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                        <h4 style={{ margin: 0 }}>Filter Options</h4>
                        {activeFilterCount > 0 && (
                            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                                Clear All
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
                        <div>
                            <label className="label">Agent</label>
                            <select className="input" name="agent_id" value={filters.agent_id} onChange={handleFilterChange}>
                                <option value="">All Agents</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Property Type</label>
                            <select className="input" name="property_type" value={filters.property_type} onChange={handleFilterChange}>
                                <option value="">All Types</option>
                                <option value="apartment">Apartment</option>
                                <option value="villa">Villa</option>
                                <option value="office">Office</option>
                                <option value="land">Land</option>
                                <option value="store">Store</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select className="input" name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="">All Statuses</option>
                                <option value="in_progress">In Progress</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Content Status</label>
                            <select className="input" name="content_status" value={filters.content_status} onChange={handleFilterChange}>
                                <option value="">All Content</option>
                                <option value="new">New</option>
                                <option value="needs_fix">Needs Fix</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">City</label>
                            <input
                                className="input"
                                name="city"
                                value={filters.city}
                                onChange={handleFilterChange}
                                placeholder="Search City..."
                            />
                        </div>
                    </div>
                </div>
            )}

            <Table data={properties} columns={columns} />

            {/* Status Change Confirmation Modal */}
            {isStatusModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>Update Content Status</h3>
                        <p style={{ marginBottom: 'var(--space-lg)', color: '#666' }}>
                            Are you sure you want to mark this property as <strong>Needs Fix</strong>?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-md)' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setIsStatusModalOpen(false);
                                    setSelectedPropertyId(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                                onClick={() => {
                                    if (selectedPropertyId) {
                                        handleContentStatusChange(selectedPropertyId, 'needs_fix');
                                    }
                                    setIsStatusModalOpen(false);
                                    setSelectedPropertyId(null);
                                }}
                            >
                                Confirm Needs Fix
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgencyPortfolio;
