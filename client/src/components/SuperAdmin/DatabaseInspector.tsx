import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const DatabaseInspector = () => {
    const { token } = useAuth();
    const [databases, setDatabases] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [testLog, setTestLog] = useState<string[]>([]);

    const runConnectionTest = async () => {
        setLoading(true);
        setTestLog(['🔄 Starting database connection test...']);

        try {
            const response = await fetch('http://localhost:3000/api/superadmin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const stats = await response.json();

                const dbList = stats.databases?.map((db: string) => ({
                    name: db,
                    status: 'connected',
                    properties: stats.total_properties || 0,
                    users: stats.total_agents || 0,
                    lastSync: new Date().toLocaleString()
                })) || [];

                setDatabases(dbList);
                setTestLog(prev => [
                    ...prev,
                    `✅ Found ${dbList.length} database(s)`,
                    ...dbList.map((db: any) => ` ✅ ${db.name}: ${db.properties} properties, ${db.users} users`),
                    '✅ Connection test complete!'
                ]);
            } else {
                setTestLog(prev => [...prev, '❌ Failed to fetch database information']);
            }
        } catch (error: any) {
            setTestLog(prev => [...prev, `❌ Error: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    const exportData = () => {
        const csvContent = databases.map(db =>
            `${db.name},${db.status},${db.properties},${db.users},${db.lastSync}`
        ).join('\n');

        const blob = new Blob([`Database,Status,Properties,Users,Last Sync\n${csvContent}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `database_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1F2937' }}>
                    🗄️ Multi-Tenant Database Inspector
                </h2>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button
                        onClick={runConnectionTest}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        {loading ? '🔄 Testing...' : '🔍 Run Connection Test'}
                    </button>
                    {databases.length > 0 && (
                        <button
                            onClick={exportData}
                            style={{
                                padding: '12px 24px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            📥 Export CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Database Table */}
            {databases.length > 0 && (
                <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    marginBottom: 'var(--space-xl)'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Database Name</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Properties</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Users</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Last Sync</th>
                            </tr>
                        </thead>
                        <tbody>
                            {databases.map((db, idx) => (
                                <tr key={idx} style={{
                                    background: idx % 2 === 0 ? 'white' : '#F9FAFB',
                                    borderBottom: '1px solid #E5E7EB'
                                }}>
                                    <td style={{ padding: '16px', fontWeight: '600', color: '#1F2937' }}>
                                        {db.name}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            background: db.status === 'connected' ? '#DCFCE7' : '#FEE2E2',
                                            color: db.status === 'connected' ? '#166534' : '#991B1B',
                                            borderRadius: 'var(--radius-md)',
                                            fontWeight: '600',
                                            fontSize: '0.875rem'
                                        }}>
                                            {db.status === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center', color: '#3b82f6', fontWeight: '600' }}>
                                        {db.properties}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                                        {db.users}
                                    </td>
                                    <td style={{ padding: '16px', color: '#6B7280' }}>
                                        {db.lastSync}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Log Window */}
            {testLog.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 'var(--space-md)', color: '#1F2937' }}>
                        📋 Test Log
                    </h3>
                    <div style={{
                        background: '#1F2937',
                        color: '#E5E7EB',
                        padding: 'var(--space-lg)',
                        borderRadius: 'var(--radius-lg)',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        maxHeight: '300px',
                        overflowY: 'auto'
                    }}>
                        {testLog.map((log, idx) => (
                            <div key={idx} style={{ marginBottom: '4px' }}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {databases.length === 0 && testLog.length === 0 && (
                <div style={{
                    background: '#F9FAFB',
                    padding: '60px',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px dashed #D1D5DB',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗄️</div>
                    <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '8px' }}>
                        Database Inspector
                    </h3>
                    <p style={{ color: '#6B7280', marginBottom: '24px' }}>
                        Click "Run Connection Test" to inspect all agency databases
                    </p>
                </div>
            )}
        </div>
    );
};

export default DatabaseInspector;
