import { Request, Response } from "express";
import pool from "../config/database";

export const getOwnerPerformance = async (req: Request, res: Response) => {
    try {
        // ---- GLOBAL KPIs ----
        const [stats]: any = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role='agent') AS total_agents,
                (SELECT COUNT(*) FROM properties) AS total_properties,
                (SELECT COUNT(*) FROM properties WHERE MONTH(created_at) = MONTH(NOW()) 
                    AND YEAR(created_at) = YEAR(NOW())) AS properties_this_month,
                (SELECT COUNT(*) FROM clients) AS total_clients;
        `);

        // ---- AGENT PERFORMANCE ----
        const [agents]: any = await pool.query(`
            SELECT 
                u.id,
                u.name,

                -- Properties added by agent
                COUNT(DISTINCT p.id) AS properties_added,

                -- Clients assigned to this agent
                COUNT(DISTINCT c.id) AS clients_added,

                -- Optional: active properties metric
                SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) AS active_properties,

                -- Performance score
                (COUNT(DISTINCT p.id) * 2 + COUNT(DISTINCT c.id)) AS score

            FROM users u
            LEFT JOIN properties p ON p.agent_id = u.id
            LEFT JOIN clients c ON c.agent_id = u.id

            WHERE u.role = 'agent'
            GROUP BY u.id
            ORDER BY score DESC;
        `);

        // ---- ACTIVITY FEED ----
        const [recent]: any = await pool.query(`
            SELECT 
                CONCAT('Property #', id, ' added in ', city) AS activity,
                created_at
            FROM properties
            ORDER BY created_at DESC
            LIMIT 5;
        `);

        const [recentClients]: any = await pool.query(`
            SELECT 
                CONCAT('New client: ', name, ' (', type, ')') AS activity,
                created_at
            FROM clients
            ORDER BY created_at DESC
            LIMIT 5;
        `);

        const activityFeed = [...recent, ...recentClients]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(item => item.activity)
            .slice(0, 8);

        // ---- RESPONSE ----
        res.json({
            ...stats[0],
            agents,
            recent_activity: activityFeed
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error", error });
    }
};
