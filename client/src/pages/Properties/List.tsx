import { useEffect, useState } from 'react';
import Table from '../../components/UI/Table';
import StatusBadge from '../../components/UI/StatusBadge';
import Modal from '../../components/UI/Modal';
import PageHeader from '../../components/Layout/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './List.css';

interface Property {
    id: number;
    property_type: string;
    purpose: string;
    city: string;
    area: string;
    price_usd: number;
    status: string;
    content_status: string;
    thumbnail?: string;
    images?: string[];
    owner_name?: string;
    owner_phone?: string;
    leads?: { id: number; name: string; phone: string }[];
}

const PropertiesList = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        keyword: '',
        property_type: '',
        status: '',
        purpose: '',
        content_status: '',
        city: '',
        area: ''
    });

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true);
                const queryParams = new URLSearchParams();
                if (filters.keyword) queryParams.append('keyword', filters.keyword);

                const response = await fetch(`http://localhost:3000/api/properties?${queryParams.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setProperties(data);
                    setFilteredProperties(data);
                }
            } catch (error) {
                console.error('Failed to fetch properties', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [token, filters.keyword, location.pathname]);

    useEffect(() => {
        let result = properties;

        if (filters.property_type) {
            result = result.filter(p => p.property_type === filters.property_type);
        }
        if (filters.status) {
            result = result.filter(p => p.status === filters.status);
        }
        if (filters.purpose) {
            result = result.filter(p => p.purpose === filters.purpose);
        }
        if (filters.content_status) {
            result = result.filter(p => p.content_status === filters.content_status);
        }
        if (filters.city) {
            result = result.filter(p => p.city.toLowerCase().includes(filters.city.toLowerCase()));
        }
        if (filters.area) {
            result = result.filter(p => p.area.toLowerCase().includes(filters.area.toLowerCase()));
        }

        setFilteredProperties(result);
    }, [properties, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            keyword: '',
            property_type: '',
            status: '',
            purpose: '',
            content_status: '',
            city: '',
            area: ''
        });
    };

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => value && key !== 'keyword').length;

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

    const columns = [
        {
            header: 'Images',
            accessor: (item: any) => (
                <div className="property-images">
                    {item.images && item.images.length > 0 ? (
                        <>
                            {item.images.slice(0, 3).map((img: string, index: number) => (
                                <img
                                    key={index}
                                    src={`http://localhost:3000/${img}`}
                                    alt="Thumbnail"
                                    className="property-thumbnail"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedImage(`http://localhost:3000/${img}`);
                                    }}
                                    title="Click to expand"
                                />
                            ))}
                            {item.images.length > 3 && (
                                <div className="image-count">
                                    +{item.images.length - 3}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="property-thumbnail placeholder" />
                    )}
                </div>
            )
        },
        {
            header: 'Type',
            accessor: (item: Property) => (
                <span className="text-capitalize">{item.property_type}</span>
            )
        },
        {
            header: 'Purpose',
            accessor: (item: Property) => (
                <span className="text-capitalize">{item.purpose}</span>
            )
        },
        { header: 'City', accessor: 'city' as keyof Property },
        { header: 'Area', accessor: 'area' as keyof Property },
        {
            header: 'Price (USD)',
            accessor: (item: Property) => (
                <span className="font-semibold">${item.price_usd.toLocaleString()}</span>
            )
        },
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
            accessor: (item: Property) => {
                const hasClients = item.owner_name || (item.leads && item.leads.length > 0);

                if (!hasClients) {
                    return <span className="text-secondary">—</span>;
                }

                return (
                    <select
                        className="input"
                        style={{
                            fontSize: '0.875rem',
                            padding: '4px 8px',
                            width: '100%',
                            maxWidth: '200px',
                            cursor: 'pointer'
                        }}
                        defaultValue=""
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="" disabled>View Interested Clients</option>

                        {item.owner_name && (
                            <optgroup label="Property Owner">
                                <option disabled>👤 {item.owner_name} ({item.owner_phone})</option>
                            </optgroup>
                        )}

                        {item.leads && item.leads.length > 0 && (
                            <optgroup label="Interested Leads">
                                {item.leads.map(lead => (
                                    <option key={lead.id} disabled>
                                        🔍 {lead.name} ({lead.phone})
                                    </option>
                                ))}
                            </optgroup>
                        )}
                    </select>
                );
            }
        },
        {
            header: '',
            accessor: (item: Property) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/properties/${item.id}`);
                    }}
                    className="btn-icon"
                    title="Edit Property"
                >
                    ✏️
                </button>
            )
        }
    ];

    return (
        <div className="properties-list-page">
            <PageHeader
                title="Properties"
                subtitle={`${filteredProperties.length} of ${properties.length} properties`}
                actions={
                    <button className="btn btn-primary" onClick={() => navigate('/properties/new')}>
                        + Add Property
                    </button>
                }
            />

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

                    <div className="filters-grid">
                        <div>
                            <label className="label">Type</label>
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
                            <label className="label">Purpose</label>
                            <select className="input" name="purpose" value={filters.purpose} onChange={handleFilterChange}>
                                <option value="">All Purposes</option>
                                <option value="sale">Sale</option>
                                <option value="rent">Rent</option>
                                <option value="both">Both</option>
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
                            <label className="label">Content</label>
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
                                placeholder="Search city..."
                            />
                        </div>
                        <div>
                            <label className="label">Area</label>
                            <input
                                className="input"
                                name="area"
                                value={filters.area}
                                onChange={handleFilterChange}
                                placeholder="Search area..."
                            />
                        </div>
                    </div>
                </div>
            )}

            <Table
                data={filteredProperties}
                columns={columns}
                onRowClick={(item) => navigate(`/properties/${item.id}`)}
                loading={loading}
                emptyMessage="No properties found. Add your first property to get started!"
            />

            {/* Image Modal */}
            <Modal
                isOpen={!!expandedImage}
                onClose={() => setExpandedImage(null)}
                size="lg"
                showClose={true}
            >
                {expandedImage && (
                    <div className="expanded-image-container">
                        <img
                            src={expandedImage}
                            alt="Expanded Property"
                            className="expanded-image"
                        />
                    </div>
                )}
            </Modal>

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

export default PropertiesList;
