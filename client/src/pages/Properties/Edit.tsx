import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Pills from '../../components/UI/Pills';
import StatusBadge from '../../components/UI/StatusBadge';
import { useToast } from '../../context/ToastContext';

const PropertyEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const isEdit = !!id;

    const [clients, setClients] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        property_type: 'apartment',
        purpose: 'sale',
        furnished: 'no',
        city: '',
        area: '',
        ownership_type: '',
        ownership_notes: '',
        built_up_area: '',
        land_area: '',
        bedrooms: '',
        bathrooms: '',
        floor_level: '',
        has_24_7_electricity: false,
        has_generator: false,
        has_elevator: false,
        has_parking: false,
        price_usd: '',
        notes: '',
        status: 'active',
        content_status: 'new',
        owner_id: '',
        lead_ids: [] as number[],
        // Optional Fields
        maid_room: false,
        balcony: false,
        terrace: false,
        heating_system: '',
        ac_system: '',
        water_tank: false,
        concierge: false,
        security: false,
        gym: false,
        pool: false,
        zoning: '',
        occupancy_status: '',
        payment_method: '',
        commission: ''
    });

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/clients', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    setClients(await res.json());
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchClients();
    }, [token]);

    const [activeSections, setActiveSections] = useState<string[]>([]);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [images, setImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<any[]>([]);
    const [feedback, setFeedback] = useState<any[]>([]);
    const [internalNotes, setInternalNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        if (isEdit) {
            const fetchProperty = async () => {
                try {
                    const response = await fetch(`http://localhost:3000/api/properties/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setFormData({
                            ...data,
                            owner_id: data.owner ? data.owner.id : '',
                            lead_ids: data.leads ? data.leads.map((l: any) => l.id) : []
                        });
                        if (data.images) {
                            setExistingImages(data.images);
                        }
                        if (data.feedback) {
                            setFeedback(data.feedback);
                        }
                        if (data.internalNotes) {
                            setInternalNotes(data.internalNotes);
                        }
                    } else {
                        showToast('Failed to load property details', 'error');
                    }
                } catch (error) {
                    console.error('Failed to fetch property', error);
                    showToast('Network error', 'error');
                }
            };
            fetchProperty();
        }
    }, [id, isEdit, token, showToast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!isEdit) return;
        console.log('Updating operational status to:', newStatus);
        try {
            const response = await fetch(`http://localhost:3000/api/properties/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            console.log('Response status:', response.status, response.statusText);
            if (response.ok) {
                const data = await response.json();
                console.log('Update successful:', data);
                setFormData(prev => ({ ...prev, status: newStatus }));
                showToast(`✓ Operational status changed to: ${newStatus.replace('_', ' ')}`, 'success');
            } else {
                const errorData = await response.json();
                console.error('Failed to update:', errorData);
                showToast(`Failed: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error: any) {
            console.error('Network error:', error);
            showToast(`Network error: ${error.message}`, 'error');
        }
    };

    const handleContentStatusChange = async (newContentStatus: string) => {
        if (!isEdit) return;
        console.log('Updating content status to:', newContentStatus);
        try {
            const response = await fetch(`http://localhost:3000/api/properties/${id}/content-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content_status: newContentStatus })
            });
            console.log('Response status:', response.status, response.statusText);
            if (response.ok) {
                const data = await response.json();
                console.log('Update successful:', data);
                setFormData(prev => ({ ...prev, content_status: newContentStatus }));
                showToast(`✓ Content status changed to: ${newContentStatus.replace('_', ' ')}`, 'success');
            } else {
                const errorData = await response.json();
                console.error('Failed to update:', errorData);
                showToast(`Failed: ${errorData.message || 'Unknown error'}`, 'error');
            }
        } catch (error: any) {
            console.error('Network error:', error);
            showToast(`Network error: ${error.message}`, 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEdit ? `http://localhost:3000/api/properties/${id}` : 'http://localhost:3000/api/properties';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                const propertyId = isEdit ? id : data.id;

                // Upload images if any
                if (images.length > 0) {
                    const formDataImages = new FormData();
                    images.forEach(image => formDataImages.append('images', image));

                    const imgResponse = await fetch(`http://localhost:3000/api/properties/${propertyId}/images`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formDataImages
                    });

                    if (!imgResponse.ok) {
                        const imgData = await imgResponse.json();
                        showToast(`Image upload failed: ${imgData.error || imgData.message}`, 'error');
                    }
                }

                showToast(`Property ${isEdit ? 'updated' : 'created'} successfully`, 'success');
                const from = (location.state as any)?.from || '/properties';
                navigate(from);
            } else {
                const data = await response.json();
                showToast(data.error || data.message || 'Failed to save property', 'error');
            }
        } catch (error: any) {
            console.error('Failed to save property', error);
            showToast(`Network error: ${error.message}`, 'error');
        }
    };

    const isLand = formData.property_type === 'land';

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1>{isEdit ? 'Edit Property' : 'Add Property'}</h1>
                <div>
                    <button type="button" className="btn btn-secondary" onClick={() => {
                        const from = (location.state as any)?.from || '/properties';
                        navigate(from);
                    }} style={{ marginRight: 'var(--space-sm)' }}>Cancel</button>
                    <button type="submit" form="property-form" className="btn btn-primary">Save</button>
                </div>
            </div>

            <form id="property-form" onSubmit={handleSubmit} className="card">
                {/* Status Management */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', backgroundColor: '#f8f9fa', borderRadius: 'var(--radius-md)' }}>
                    <div>
                        <label className="label">Operational Status *</label>
                        <select
                            className="input"
                            name="status"
                            value={formData.status}
                            onChange={(e) => {
                                if (isEdit) {
                                    handleStatusChange(e.target.value);
                                } else {
                                    handleChange(e);
                                }
                            }}
                            required
                        >
                            {user?.role === 'agent' ? (
                                <>
                                    <option value="in_progress">In Progress</option>
                                    <option value="closed">Closed</option>
                                </>
                            ) : (
                                <>
                                    <option value="active">Active</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="archived">Archived</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="closed">Closed</option>
                                </>
                            )}
                        </select>
                    </div>
                    {isEdit && (
                        <div>
                            <label className="label">Content Workflow Status</label>
                            <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
                                <div
                                    onClick={() => {
                                        if (user?.role === 'owner' && formData.content_status !== 'needs_fix') {
                                            setIsStatusModalOpen(true);
                                        }
                                    }}
                                    style={{
                                        cursor: user?.role === 'owner' && formData.content_status !== 'needs_fix' ? 'pointer' : 'default'
                                    }}
                                >
                                    <StatusBadge status={formData.content_status as any} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
                                    onClick={() => setIsStatusModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
                                    onClick={() => {
                                        handleContentStatusChange('needs_fix');
                                        setIsStatusModalOpen(false);
                                    }}
                                >
                                    Confirm Needs Fix
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Curator Feedback Section - Show when status is "needs_fix" */}
                {isEdit && formData.content_status === 'needs_fix' && feedback.length > 0 && (
                    <div style={{
                        padding: 'var(--space-md)',
                        marginBottom: 'var(--space-lg)',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <h3 style={{ marginBottom: 'var(--space-sm)', color: '#856404', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>⚠️ Curator Feedback</span>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!confirm('Clear all curator feedback for this property?')) return;
                                    try {
                                        const res = await fetch(`http://localhost:3000/api/properties/${id}/feedback`, {
                                            method: 'DELETE',
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        if (res.ok) {
                                            setFeedback([]);
                                            showToast('Feedback cleared', 'success');
                                        } else {
                                            showToast('Failed to clear feedback', 'error');
                                        }
                                    } catch (error) {
                                        console.error(error);
                                        showToast('Network error', 'error');
                                    }
                                }}
                                style={{
                                    padding: '4px 12px',
                                    fontSize: '0.875rem',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Feedback
                            </button>
                        </h3>
                        {feedback.map((fb: any) => (
                            <div key={fb.id} style={{
                                marginBottom: 'var(--space-md)',
                                padding: 'var(--space-sm)',
                                backgroundColor: 'white',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--space-xs)',
                                    fontSize: '0.875rem',
                                    color: '#6c757d'
                                }}>
                                    <span><strong>{fb.curator_name}</strong></span>
                                    <span>{new Date(fb.created_at).toLocaleDateString()}</span>
                                </div>
                                {fb.comments && (
                                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                                        <strong>Comments:</strong>
                                        <p style={{ margin: '4px 0 0 0' }}>{fb.comments}</p>
                                    </div>
                                )}
                                {fb.requested_changes && (
                                    <div>
                                        <strong>Requested Changes:</strong>
                                        <p style={{ margin: '4px 0 0 0' }}>{fb.requested_changes}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}



                {/* Core Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <label className="label">Property Type</label>
                        <select name="property_type" className="input" value={formData.property_type} onChange={handleChange} required>
                            <option value="apartment">Apartment</option>
                            <option value="villa">Villa</option>
                            <option value="office">Office</option>
                            <option value="land">Land</option>
                            <option value="store">Store</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Purpose</label>
                        <select name="purpose" className="input" value={formData.purpose} onChange={handleChange} required>
                            <option value="sale">Sale</option>
                            <option value="rent">Rent</option>
                            <option value="both">Both</option>
                        </select>
                    </div>

                    {!isLand && (
                        <div>
                            <label className="label">Furnished</label>
                            <select name="furnished" className="input" value={formData.furnished} onChange={handleChange}>
                                <option value="no">No</option>
                                <option value="yes">Yes</option>
                                <option value="partially">Partially</option>
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="label">City</label>
                        <input name="city" className="input" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="label">Area / Neighborhood</label>
                        <input name="area" className="input" value={formData.area} onChange={handleChange} required />
                    </div>

                    <div>
                        <label className="label">Ownership Type</label>
                        <input name="ownership_type" className="input" value={formData.ownership_type} onChange={handleChange} required placeholder="e.g. Green Deed" />
                    </div>

                    {isLand ? (
                        <div>
                            <label className="label">Land Area (sqm)</label>
                            <input name="land_area" type="number" className="input" value={formData.land_area} onChange={handleChange} required />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="label">Built-up Area (sqm)</label>
                                <input name="built_up_area" type="number" className="input" value={formData.built_up_area} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="label">Bedrooms</label>
                                <input name="bedrooms" type="number" className="input" value={formData.bedrooms} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="label">Bathrooms</label>
                                <input name="bathrooms" type="number" className="input" value={formData.bathrooms} onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="label">Floor Level</label>
                                <input name="floor_level" type="number" className="input" value={formData.floor_level} onChange={handleChange} required />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="label">Price (USD)</label>
                        <input name="price_usd" type="number" className="input" value={formData.price_usd} onChange={handleChange} required />
                    </div>
                </div>

                {/* Toggles */}
                {!isLand && (
                    <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <input type="checkbox" name="has_24_7_electricity" checked={formData.has_24_7_electricity} onChange={handleChange} />
                            24/7 Electricity
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <input type="checkbox" name="has_generator" checked={formData.has_generator} onChange={handleChange} />
                            Generator
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <input type="checkbox" name="has_elevator" checked={formData.has_elevator} onChange={handleChange} />
                            Elevator
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <input type="checkbox" name="has_parking" checked={formData.has_parking} onChange={handleChange} />
                            Parking
                        </label>
                    </div>
                )}

                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <label className="label">Notes</label>
                    <textarea name="notes" className="input" rows={4} value={formData.notes} onChange={handleChange} />
                </div>

                {/* Client Linking Section */}
                {/* Client Linking Section */}
                {isEdit && (
                    <div style={{
                        padding: 'var(--space-md)',
                        marginBottom: 'var(--space-lg)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#fff'
                    }}>
                        <h3 style={{ marginBottom: 'var(--space-md)' }}>Client Links</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                            <div>
                                <label className="label">Owner</label>
                                <select
                                    name="owner_id"
                                    className="input"
                                    value={formData.owner_id || ''}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Owner...</option>
                                    {clients.filter(c => c.type === 'owner').map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Interested Leads</label>
                                <select
                                    multiple
                                    className="input"
                                    style={{ height: '100px' }}
                                    value={formData.lead_ids?.map(String) || []}
                                    onChange={(e) => {
                                        const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
                                        setFormData(prev => ({ ...prev, lead_ids: selectedOptions }));
                                    }}
                                >
                                    {clients.filter(c => c.type === 'lead').map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                                <small style={{ color: '#666' }}>Hold Ctrl/Cmd to select multiple</small>
                            </div>
                        </div>
                    </div>
                )}


                <Pills
                    items={[
                        { id: 'layout', label: 'Layout & Areas' },
                        { id: 'utilities', label: 'Advanced Utilities' },
                        { id: 'services', label: 'Building Services' },
                        { id: 'legal', label: 'Legal & Occupancy' },
                        { id: 'financial', label: 'Financial Extras' },
                        { id: 'notes', label: 'Additional Internal Notes' },
                        { id: 'images', label: 'Images' }
                    ]}
                    activeIds={activeSections}
                    onChange={(id) => {
                        setActiveSections(prev => {
                            if (prev.includes(id)) {
                                return prev.filter(item => item !== id);
                            } else {
                                return [...prev, id];
                            }
                        });
                    }}
                />

                {/* Dynamic Sections Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                    {['layout', 'utilities', 'services', 'legal', 'financial', 'notes', 'images']
                        .filter(id => activeSections.includes(id))
                        .map(sectionId => (
                            <div key={sectionId} className="fade-in">
                                {sectionId === 'notes' && (
                                    <div style={{
                                        padding: 'var(--space-md)',
                                        backgroundColor: '#e9ecef',
                                        border: '1px solid #dee2e6',
                                        borderRadius: 'var(--radius-md)'
                                    }}>
                                        <h3 style={{ marginBottom: 'var(--space-sm)', color: '#495057' }}>🔒 Internal Notes</h3>
                                        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: 'var(--space-md)' }}>
                                            Private notes for agents/admins only. Not visible to curators or clients.
                                        </p>

                                        {/* Add new note form */}
                                        <div style={{ marginBottom: 'var(--space-md)' }}>
                                            <textarea
                                                className="input"
                                                rows={2}
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Add a private note..."
                                                style={{ marginBottom: 'var(--space-sm)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!newNote.trim()) return;
                                                    try {
                                                        const res = await fetch(`http://localhost:3000/api/properties/${id}/notes`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                Authorization: `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ note: newNote })
                                                        });
                                                        if (res.ok) {
                                                            // Refetch notes
                                                            const notesRes = await fetch(`http://localhost:3000/api/properties/${id}/notes`, {
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            if (notesRes.ok) {
                                                                const notes = await notesRes.json();
                                                                setInternalNotes(notes);
                                                            }
                                                            setNewNote('');
                                                            showToast('Note added', 'success');
                                                        } else {
                                                            showToast('Failed to add note', 'error');
                                                        }
                                                    } catch (error) {
                                                        console.error(error);
                                                        showToast('Network error', 'error');
                                                    }
                                                }}
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.875rem', padding: '6px 16px' }}
                                            >
                                                Add Note
                                            </button>
                                        </div>

                                        {/* Display existing notes */}
                                        {internalNotes.length > 0 && (
                                            <div>
                                                <strong style={{ fontSize: '0.875rem', color: '#495057' }}>Previous Notes:</strong>
                                                {internalNotes.map((note: any) => (
                                                    <div key={note.id} style={{
                                                        marginTop: 'var(--space-sm)',
                                                        padding: 'var(--space-sm)',
                                                        backgroundColor: 'white',
                                                        borderRadius: 'var(--radius-sm)',
                                                        borderLeft: '3px solid #6c757d'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            marginBottom: '4px',
                                                            fontSize: '0.75rem',
                                                            color: '#6c757d'
                                                        }}>
                                                            <span><strong>{note.author_name}</strong></span>
                                                            <span>{new Date(note.created_at).toLocaleString()}</span>
                                                        </div>
                                                        <p style={{ margin: 0, fontSize: '0.875rem' }}>{note.note}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {sectionId === 'layout' && (
                                    <div style={{ padding: 'var(--space-md)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Layout & Areas</h4>
                                        <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="maid_room" checked={formData.maid_room} onChange={handleChange} />
                                                Maid Room
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="balcony" checked={formData.balcony} onChange={handleChange} />
                                                Balcony
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="terrace" checked={formData.terrace} onChange={handleChange} />
                                                Terrace
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {sectionId === 'utilities' && (
                                    <div style={{ padding: 'var(--space-md)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Advanced Utilities</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div>
                                                <label className="label">Heating System</label>
                                                <input name="heating_system" className="input" value={formData.heating_system} onChange={handleChange} placeholder="e.g. Radiators, Underfloor" />
                                            </div>
                                            <div>
                                                <label className="label">A/C System</label>
                                                <input name="ac_system" className="input" value={formData.ac_system} onChange={handleChange} placeholder="e.g. Split, Central" />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 'var(--space-md)' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="water_tank" checked={formData.water_tank} onChange={handleChange} />
                                                Water Tank
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {sectionId === 'services' && (
                                    <div style={{ padding: 'var(--space-md)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Building Services</h4>
                                        <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="concierge" checked={formData.concierge} onChange={handleChange} />
                                                Concierge
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="security" checked={formData.security} onChange={handleChange} />
                                                24/7 Security
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="gym" checked={formData.gym} onChange={handleChange} />
                                                Gym
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <input type="checkbox" name="pool" checked={formData.pool} onChange={handleChange} />
                                                Swimming Pool
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {sectionId === 'legal' && (
                                    <div style={{ padding: 'var(--space-md)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Legal & Occupancy</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div>
                                                <label className="label">Zoning</label>
                                                <input name="zoning" className="input" value={formData.zoning} onChange={handleChange} placeholder="e.g. Residential A" />
                                            </div>
                                            <div>
                                                <label className="label">Occupancy Status</label>
                                                <input name="occupancy_status" className="input" value={formData.occupancy_status} onChange={handleChange} placeholder="e.g. Vacant, Tenanted" />
                                            </div>
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label className="label">Ownership Notes</label>
                                                <textarea name="ownership_notes" className="input" rows={2} value={formData.ownership_notes} onChange={handleChange} placeholder="Additional ownership details..." />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {sectionId === 'financial' && (
                                    <div style={{ padding: 'var(--space-md)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Financial Extras</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                                            <div>
                                                <label className="label">Payment Method</label>
                                                <input name="payment_method" className="input" value={formData.payment_method} onChange={handleChange} placeholder="e.g. Cash, Cheque" />
                                            </div>
                                            <div>
                                                <label className="label">Commission</label>
                                                <input name="commission" className="input" value={formData.commission} onChange={handleChange} placeholder="e.g. 2.5%" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {sectionId === 'images' && (
                                    <div style={{ padding: 'var(--space-md)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Images</h4>
                                        <label className="label">Upload New Images</label>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ marginBottom: 'var(--space-md)' }}
                                        />
                                        {/* Preview New Images */}
                                        {images.length > 0 && (
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-md)' }}>
                                                {images.map((img, index) => (
                                                    <div key={index} style={{ position: 'relative' }}>
                                                        <img
                                                            src={URL.createObjectURL(img)}
                                                            alt="Preview"
                                                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setImages(images.filter((_, i) => i !== index))}
                                                            style={{
                                                                position: 'absolute', top: -5, right: -5,
                                                                background: 'red', color: 'white', border: 'none', borderRadius: '50%',
                                                                width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Existing Images */}
                                        {existingImages.length > 0 && (
                                            <div>
                                                <label className="label">Existing Images</label>
                                                <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                                    {existingImages.map((img: any) => (
                                                        <div key={img.id} style={{ position: 'relative' }}>
                                                            <img
                                                                src={`http://localhost:3000/${img.file_path}`}
                                                                alt="Existing"
                                                                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    if (confirm('Delete this image?')) {
                                                                        try {
                                                                            await fetch(`http://localhost:3000/api/properties/${id}/images/${img.id}`, {
                                                                                method: 'DELETE',
                                                                                headers: { Authorization: `Bearer ${token}` }
                                                                            });
                                                                            setExistingImages(prev => prev.filter(i => i.id !== img.id));
                                                                            showToast('Image deleted', 'success');
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                            showToast('Failed to delete image', 'error');
                                                                        }
                                                                    }
                                                                }}
                                                                style={{
                                                                    position: 'absolute', top: -5, right: -5,
                                                                    background: 'red', color: 'white', border: 'none', borderRadius: '50%',
                                                                    width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            </form >
        </div >
    );
};

export default PropertyEdit;
