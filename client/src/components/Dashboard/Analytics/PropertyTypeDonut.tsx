import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import DonutWithText from '../../Charts/DonutWithText';

interface PropertyTypeData {
    property_type: string;
    count: number;
    color: string;
}

const PropertyTypeDonut = () => {
    const { token } = useAuth();
    const [data, setData] = useState<PropertyTypeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await fetch('http://localhost:3000/api/analytics/property-type-distribution', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Failed to fetch property distribution:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card" style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
            </div>
        );
    }

    if (error || data.length === 0) {
        return (
            <div className="card" style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                    {error ? 'Error loading data' : 'No properties available'}
                </div>
            </div>
        );
    }

    // Transform data for DonutWithText component
    const donutData = data.map(item => ({
        label: item.property_type.charAt(0).toUpperCase() + item.property_type.slice(1),
        value: item.count
    }));

    return <DonutWithText data={donutData} centerLabel="Properties" />;
};

export default PropertyTypeDonut;
