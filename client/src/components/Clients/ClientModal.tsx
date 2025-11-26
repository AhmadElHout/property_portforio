import React, { useState, useEffect } from 'react';

interface Client {
    id?: number;
    name: string;
    type: 'owner' | 'lead';
    phone: string;
    email: string;
    whatsapp: string;
    status: string;
    notes: string;
}

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    client?: Client;
    token: string;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSave, client, token }) => {
    const [formData, setFormData] = useState<Client>({
        name: '',
        type: 'lead',
        phone: '',
        email: '',
        whatsapp: '',
        status: 'request_contact_info',
        notes: ''
    });

    useEffect(() => {
        if (client) {
            setFormData(client);
        } else {
            setFormData({
                name: '',
                type: 'lead',
                phone: '',
                email: '',
                whatsapp: '',
                status: 'request_contact_info',
                notes: ''
            });
        }
    }, [client, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'type') {
                return {
                    ...prev,
                    [name]: value as 'owner' | 'lead',
                    status: value === 'owner' ? 'in_progress' : 'request_contact_info'
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = client ? `http://localhost:3000/api/clients/${client.id}` : 'http://localhost:3000/api/clients';
            const method = client ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                onSave();
                onClose();
            } else {
                const data = await response.json();
                alert(`Failed to save client: ${data.error || data.message}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error saving client');
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px', maxWidth: '90%',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <h2>{client ? 'Edit Client' : 'Add New Client'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Name</label>
                        <input name="name" className="input" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Type</label>
                        <select name="type" className="input" value={formData.type} onChange={handleChange}>
                            <option value="owner">Owner</option>
                            <option value="lead">Lead</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Phone</label>
                            <input name="phone" className="input" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="label">WhatsApp</label>
                            <input name="whatsapp" className="input" value={formData.whatsapp} onChange={handleChange} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Email</label>
                        <input name="email" className="input" value={formData.email} onChange={handleChange} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Status</label>
                        <select name="status" className="input" value={formData.status} onChange={handleChange}>
                            {formData.type === 'owner' ? (
                                <>
                                    <option value="in_progress">In Progress</option>
                                    <option value="idle">Idle</option>
                                    <option value="closed">Closed</option>
                                </>
                            ) : (
                                <>
                                    <option value="request_contact_info">Request Contact Info</option>
                                    <option value="request_preferences">Request Preferences</option>
                                    <option value="closed">Closed</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Internal Notes</label>
                        <textarea name="notes" className="input" rows={3} value={formData.notes || ''} onChange={handleChange} placeholder="Private notes..." />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientModal;
