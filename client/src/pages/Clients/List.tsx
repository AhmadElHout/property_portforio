import { useEffect, useState } from 'react';
import Table from '../../components/UI/Table';
import PageHeader from '../../components/Layout/PageHeader';
import { useAuth } from '../../context/AuthContext';
import ClientModal from '../../components/Clients/ClientModal';
import './List.css';

interface Client {
    id: number;
    name: string;
    type: 'owner' | 'lead';
    phone: string;
    email: string;
    whatsapp: string;
    status: string;
    notes: string;
    properties?: {
        viewed: { count: number; ids: number[] };
        interested: { count: number; ids: number[] };
        will_view: { count: number; ids: number[] };
    };
}

const ClientsList = () => {
    const { token } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'owner' | 'lead'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3000/api/clients/with-properties', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setClients(data);
            } else {
                console.error('Failed to fetch clients', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [token]);

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedClient(undefined);
        setIsModalOpen(true);
    };

    const filteredClients = filter === 'all' ? clients : clients.filter(c => c.type === filter);

    const ownerCount = clients.filter(c => c.type === 'owner').length;
    const leadCount = clients.filter(c => c.type === 'lead').length;

    const columns = [
        {
            header: 'Name',
            accessor: (item: Client) => (
                <span className="font-medium">{item.name}</span>
            ),
        },
        {
            header: 'Type',
            accessor: (item: Client) => (
                <span className={`client-type-badge ${item.type}`}> {item.type === 'owner' ? '👤 Property Owner' : '🔍 Lead'} </span>
            ),
        },
        {
            header: 'Phone',
            accessor: (item: Client) => (
                <a href={`tel:${item.phone}`} className="contact-link">📞 {item.phone}</a>
            ),
        },
        {
            header: 'Email',
            accessor: (item: Client) => (
                <a href={`mailto:${item.email}`} className="contact-link">✉️ {item.email}</a>
            ),
        },
        {
            header: 'Status',
            accessor: (item: Client) => (
                <span className="status-text">{item.status.replace(/_/g, ' ')}</span>
            ),
        },
        {
            header: 'Properties',
            accessor: (item: Client) => (
                <div className="properties-badge">
                    <span title={`Viewed: ${item.properties?.viewed?.ids?.join(', ') || 'None'}`}>👁️ {item.properties?.viewed?.count || 0}</span>
                    <span title={`Interested: ${item.properties?.interested?.ids?.join(', ') || 'None'}`} style={{ marginLeft: '0.5rem' }}>⭐ {item.properties?.interested?.count || 0}</span>
                    <span title={`Will View: ${item.properties?.will_view?.ids?.join(', ') || 'None'}`} style={{ marginLeft: '0.5rem' }}>🗓️ {item.properties?.will_view?.count || 0}</span>
                </div>
            ),
        },
        {
            header: '',
            accessor: (item: Client) => (
                <button
                    onClick={e => { e.stopPropagation(); handleEdit(item); }}
                    className="btn-icon"
                    title="Edit Client"
                >
                    ✏️
                </button>
            ),
        },
    ];

    return (
        <div className="clients-list-page">
            <PageHeader
                title="Clients"
                subtitle={`${clients.length} total clients (${ownerCount} owners, ${leadCount} leads)`}
                actions={<button className="btn btn-primary" onClick={handleAdd}>+ Add Client</button>}
            />
            {/* Filter Pills */}
            <div className="filter-pills fade-in">
                <button
                    className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({clients.length})
                </button>
                <button
                    className={`filter-pill ${filter === 'owner' ? 'active' : ''}`}
                    onClick={() => setFilter('owner')}
                >
                    👤 Owners ({ownerCount})
                </button>
                <button
                    className={`filter-pill ${filter === 'lead' ? 'active' : ''}`}
                    onClick={() => setFilter('lead')}
                >
                    🔍 Leads ({leadCount})
                </button>
            </div>
            <Table
                data={filteredClients}
                columns={columns}
                loading={loading}
                emptyMessage="No clients found. Add your first client to get started!"
            />
            <ClientModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedClient(undefined); }}
                onSave={() => { fetchClients(); setIsModalOpen(false); setSelectedClient(undefined); }}
                client={selectedClient}
                token={token || ''}
            />
        </div>
    );
};

export default ClientsList;
