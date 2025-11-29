import { useEffect, useState } from 'react';
import Table from '../../components/UI/Table';
import StatusBadge from '../../components/UI/StatusBadge';
import PageHeader from '../../components/Layout/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Queue.css';

interface Property {
    id: number;
    property_type: string;
    city: string;
    area: string;
    agent_name: string;
    content_status: string;
    updated_at: string;
    thumbnail?: string;
}

const ContentQueue = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQueue = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3000/api/properties', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setProperties(data);
                }
            } catch (error) {
                console.error('Failed to fetch queue', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQueue();
    }, [token]);

    const filteredProperties = statusFilter === 'all'
        ? properties
        : properties.filter(p => p.content_status === statusFilter);

    const statusCounts = {
        new: properties.filter(p => p.content_status === 'new').length,
        in_review: properties.filter(p => p.content_status === 'in_review').length,
        needs_fix: properties.filter(p => p.content_status === 'needs_fix').length,
        ready: properties.filter(p => p.content_status === 'ready').length,
    };

    const columns = [
        {
            header: 'Image',
            accessor: (item: Property) => item.thumbnail ? (
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
        {
            header: 'Type',
            accessor: (item: Property) => (
                <span className="text-capitalize">{item.property_type}</span>
            )
        },
        { header: 'City', accessor: 'city' as keyof Property },
        { header: 'Area', accessor: 'area' as keyof Property },
        {
            header: 'Agent',
            accessor: (item: Property) => (
                <div className="agent-badge">
                    <div className="agent-avatar">{item.agent_name?.charAt(0).toUpperCase()}</div>
                    <span>{item.agent_name}</span>
                </div>
            )
        },
        {
            header: 'Content Status',
            accessor: (item: Property) => (
                <StatusBadge status={item.content_status as any} />
            )
        },
        {
            header: 'Last Updated',
            accessor: (item: Property) => (
                <span className="text-secondary text-sm">
                    {new Date(item.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </span>
            )
        },
    ];

    return (
        <div className="content-queue-page">
            <PageHeader
                title="Content Queue"
                subtitle={`${filteredProperties.length} properties awaiting review`}
            />

            {/* Status Filter Pills */}
            <div className="status-filters fade-in">
                <button
                    className={`status-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                >
                    📋 All ({properties.length})
                </button>
                <button
                    className={`status-filter-pill new ${statusFilter === 'new' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('new')}
                >
                    🆕 New ({statusCounts.new})
                </button>
                <button
                    className={`status-filter-pill in-review ${statusFilter === 'in_review' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('in_review')}
                >
                    👀 In Review ({statusCounts.in_review})
                </button>
                <button
                    className={`status-filter-pill needs-fix ${statusFilter === 'needs_fix' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('needs_fix')}
                >
                    ⚠️ Needs Fix ({statusCounts.needs_fix})
                </button>
                <button
                    className={`status-filter-pill ready ${statusFilter === 'ready' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('ready')}
                >
                    ✅ Ready ({statusCounts.ready})
                </button>
            </div>

            <Table
                data={filteredProperties}
                columns={columns}
                onRowClick={(item) => navigate(`/content-queue/${item.id}`)}
                loading={loading}
                emptyMessage="No properties in the content queue."
            />
        </div>
    );
};

export default ContentQueue;
