import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const ExistingOwnerInsights = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const loadStats = async () => {
            const response = await fetch("http://localhost:3000/api/owner/performance", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setStats(await response.json());
            }
        };

        loadStats();
    }, [token]);

    return (
        <>
            {/* KPI CARDS */}
            <div className="kpi-grid fade-in">
                <div className="kpi-card">
                    <h3>{stats?.total_agents ?? "—"}</h3>
                    <p>Total Agents</p>
                </div>
                <div className="kpi-card">
                    <h3>{stats?.total_properties ?? "—"}</h3>
                    <p>Total Properties</p>
                </div>
                <div className="kpi-card">
                    <h3>{stats?.properties_this_month ?? "—"}</h3>
                    <p>New This Month</p>
                </div>
                <div className="kpi-card">
                    <h3>{stats?.total_clients ?? "—"}</h3>
                    <p>Total Clients</p>
                </div>
            </div>

            {/* TOP AGENTS */}
            <h2 className="section-title">Top Performing Agents</h2>
            <div className="performance-table fade-in">
                <table>
                    <thead>
                        <tr>
                            <th>Agent</th>
                            <th>Properties Added</th>
                            <th>Clients Added</th>
                            <th>Notes Created</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(stats?.agents || []).map((agent: any) => (
                            <tr key={agent.id}>
                                <td>{agent.name}</td>
                                <td>{agent.properties_added}</td>
                                <td>{agent.clients_added}</td>
                                <td>{agent.notes_created}</td>
                                <td><strong>{agent.score}</strong></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* RECENT ACTIVITY */}
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-feed fade-in">
                {(stats?.recent_activity || []).map((item: any, index: number) => (
                    <div className="activity-item" key={index}>
                        <span>📌</span>
                        <p>{item}</p>
                    </div>
                ))}
            </div>
        </>
    );
};

export default ExistingOwnerInsights;
