import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PropertyReview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [property, setProperty] = useState<any>(null);
    const [status, setStatus] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/properties/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setProperty(data);
                    setStatus(data.content_status);
                }
            } catch (error) {
                console.error('Failed to fetch property', error);
            }
        };
        fetchProperty();
    }, [id, token]);

    const handleUpdateStatus = async () => {
        try {
            const statusResponse = await fetch(`http://localhost:3000/api/properties/${id}/content-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content_status: status })
            });

            if (!statusResponse.ok) {
                const errorData = await statusResponse.json();
                alert(`Failed to update status: ${errorData.message || 'Unknown error'}`);
                return;
            }

            if (notes.trim()) {
                await fetch(`http://localhost:3000/api/properties/${id}/feedback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        comments: notes,
                        requested_changes: status === 'needs_fix' ? notes : ''
                    })
                });
            }

            alert(`✓ Property status updated to: ${status.replace('_', ' ')}`);
            navigate('/content-queue');
        } catch (error: any) {
            console.error('Failed to update status', error);
            alert(`Network error: ${error.message}`);
        }
    };

    if (!property) return <div>Loading...</div>;

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <h1>Review Property: {property.property_type} in {property.city}</h1>
                <button className="btn btn-secondary" onClick={() => navigate('/content-queue')}>Back to Queue</button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div><strong>Type:</strong> {property.property_type}</div>
                    <div><strong>Purpose:</strong> {property.purpose}</div>
                    <div><strong>City:</strong> {property.city}</div>
                    <div><strong>Area:</strong> {property.area}</div>
                    <div><strong>Price:</strong> ${property.price_usd}</div>
                    <div><strong>Agent:</strong> {property.agent_name}</div>
                </div>
                <div style={{ marginTop: 'var(--space-md)' }}>
                    <strong>Description/Notes:</strong>
                    <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{property.notes}</p>
                </div>

                {/* Optional Sections Stack */}
                <div style={{ marginTop: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

                    {/* Layout & Areas */}
                    {property.property_type !== 'land' && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: 'var(--space-md)' }}>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: '#495057' }}>Layout & Areas</h4>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <span style={{ padding: '4px 12px', background: property.maid_room ? '#e6f4ea' : '#f1f3f4', borderRadius: '16px', fontSize: '0.875rem' }}>
                                    Maid Room: {property.maid_room ? 'Yes' : 'No'}
                                </span>
                                <span style={{ padding: '4px 12px', background: property.balcony ? '#e6f4ea' : '#f1f3f4', borderRadius: '16px', fontSize: '0.875rem' }}>
                                    Balcony: {property.balcony ? 'Yes' : 'No'}
                                </span>
                                <span style={{ padding: '4px 12px', background: property.terrace ? '#e6f4ea' : '#f1f3f4', borderRadius: '16px', fontSize: '0.875rem' }}>
                                    Terrace: {property.terrace ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Advanced Utilities */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: 'var(--space-sm)', color: '#495057' }}>Advanced Utilities</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
                            <div><strong>Heating:</strong> {property.heating_system || 'N/A'}</div>
                            <div><strong>A/C:</strong> {property.ac_system || 'N/A'}</div>
                            <div><strong>Water Tank:</strong> {property.water_tank ? 'Yes' : 'No'}</div>
                        </div>
                    </div>

                    {/* Building Services */}
                    {property.property_type !== 'land' && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: 'var(--space-md)' }}>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: '#495057' }}>Building Services</h4>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                <span style={{ padding: '4px 12px', background: property.concierge ? '#e6f4ea' : '#f1f3f4', borderRadius: '16px', fontSize: '0.875rem' }}>
                                    Concierge: {property.concierge ? 'Yes' : 'No'}
                                </span>
                                <span style={{ padding: '4px 12px', background: property.security ? '#e6f4ea' : '#f1f3f4', borderRadius: '16px', fontSize: '0.875rem' }}>
                                    Security: {property.security ? 'Yes' : 'No'}
                                </span>
                                <span style={{ padding: '4px 12px', background: property.gym ? '#e6f4ea' : '#f1f3f4', borderRadius: '16px', fontSize: '0.875rem' }}>
                                    Gym: {property.gym ? 'Yes' : 'No'}
                                </span>
                                <span style={{ padding: '4px 12px', background: property.pool ? '#e6f4ea' : '#f1f3f4', borderRadius: '16px', fontSize: '0.875rem' }}>
                                    Pool: {property.pool ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Legal & Occupancy */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: 'var(--space-sm)', color: '#495057' }}>Legal & Occupancy</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
                            <div><strong>Zoning:</strong> {property.zoning || 'N/A'}</div>
                            <div><strong>Occupancy:</strong> {property.occupancy_status || 'N/A'}</div>
                            <div style={{ gridColumn: '1 / -1' }}><strong>Ownership Notes:</strong> {property.ownership_notes || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Financial Extras */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: 'var(--space-sm)', color: '#495057' }}>Financial Extras</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: '0.9rem' }}>
                            <div><strong>Payment Method:</strong> {property.payment_method || 'N/A'}</div>
                            <div><strong>Commission:</strong> {property.commission || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Images */}
                    {property.images && property.images.length > 0 && (
                        <div style={{ borderTop: '1px solid #eee', paddingTop: 'var(--space-md)' }}>
                            <h4 style={{ marginBottom: 'var(--space-sm)', color: '#495057' }}>Images</h4>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)', overflowX: 'auto', padding: 'var(--space-sm) 0' }}>
                                {property.images.map((img: any) => (
                                    <img key={img.id} src={`http://localhost:3000/${img.file_path}`} alt="Property" style={{ height: '150px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <h2 style={{ marginBottom: 'var(--space-md)' }}>Curator Action</h2>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label className="label">Content Status</label>
                    <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="new">New</option>
                        <option value="in_review">In Review</option>
                        <option value="needs_fix">Needs Fix</option>
                        <option value="ready">Ready</option>
                    </select>
                </div>
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label className="label">Feedback / Notes</label>
                    <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes for the agent..." />
                </div>
                <button className="btn btn-primary" onClick={handleUpdateStatus}>Update Status</button>
            </div>
        </div>
    );
};

export default PropertyReview;
