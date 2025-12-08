import { Request, Response } from 'express';
import { getPlatformDb, getAgencyDb, queryAllAgencies } from '../config/multiDb';
import { RowDataPacket } from 'mysql2';

// GET /super-admin/agencies
export const getAgencies = async (req: Request, res: Response) => {
    try {
        const db = await getPlatformDb();
        const [agencies] = await db.execute<RowDataPacket[]>('SELECT * FROM agencies ORDER BY created_at DESC');
        res.json(agencies);
    } catch (error: any) {
        console.error('Error fetching agencies:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /super-admin/agency/:id/properties
export const getAgencyProperties = async (req: Request, res: Response) => {
    const agencyId = parseInt(req.params.id);
    try {
        const db = await getAgencyDb(agencyId);
        const [properties] = await db.execute<RowDataPacket[]>(`
            SELECT p.*, u.name AS agent_name, u.email as agent_email
            FROM properties p
            JOIN users u ON u.id = p.agent_id
            ORDER BY p.created_at DESC
        `);
        res.json(properties);
    } catch (error: any) {
        console.error(`Error fetching properties for agency ${agencyId}:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /super-admin/agency/:id/summary
export const getAgencySummary = async (req: Request, res: Response) => {
    const agencyId = parseInt(req.params.id);
    try {
        const db = await getPlatformDb();
        const [summary] = await db.execute<RowDataPacket[]>(
            'SELECT * FROM agency_performance_summary WHERE agency_id = ?',
            [agencyId]
        );

        if (summary.length === 0) {
            return res.status(404).json({ message: 'Summary not found. Try syncing first.' });
        }

        res.json(summary[0]);
    } catch (error: any) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST /super-admin/sync
export const syncSummaries = async (req: Request, res: Response) => {
    try {
        const platformDb = await getPlatformDb();
        const [agencies] = await platformDb.execute<RowDataPacket[]>('SELECT id FROM agencies WHERE status = "active"');

        const results = [];

        for (const agency of agencies) {
            try {
                const agencyDb = await getAgencyDb(agency.id);

                // 1. Total Properties
                const [propCount] = await agencyDb.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM properties');
                const totalProperties = propCount[0].count;

                // 2. Avg Price & Area
                const [avgs] = await agencyDb.execute<RowDataPacket[]>('SELECT AVG(price_usd) as avg_price, AVG(built_up_area) as avg_area FROM properties');
                const avgPrice = avgs[0].avg_price || 0;
                const avgArea = avgs[0].avg_area || 0;

                // 3. Properties by Type
                const [types] = await agencyDb.execute<RowDataPacket[]>('SELECT property_type, COUNT(*) as count FROM properties GROUP BY property_type');
                const propertiesByType = types.reduce((acc: any, curr: any) => {
                    acc[curr.property_type] = curr.count;
                    return acc;
                }, {});

                // 4. Leads Count
                const [leadCount] = await agencyDb.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM clients WHERE type = "lead"');
                const leadsCount = leadCount[0].count;

                // Update Platform DB
                await platformDb.execute(`
                    INSERT INTO agency_performance_summary 
                    (agency_id, total_properties, avg_price, avg_area, properties_by_type, leads_count, last_sync_time)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                    total_properties = VALUES(total_properties),
                    avg_price = VALUES(avg_price),
                    avg_area = VALUES(avg_area),
                    properties_by_type = VALUES(properties_by_type),
                    leads_count = VALUES(leads_count),
                    last_sync_time = NOW()
                `, [agency.id, totalProperties, avgPrice, avgArea, JSON.stringify(propertiesByType), leadsCount]);

                results.push({ agencyId: agency.id, status: 'synced' });

            } catch (err: any) {
                console.error(`Failed to sync agency ${agency.id}:`, err);
                results.push({ agencyId: agency.id, status: 'failed', error: err.message });
            }
        }

        res.json({ message: 'Sync completed', results });

    } catch (error: any) {
        console.error('Sync failed:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ====== NEW AGGREGATION ENDPOINTS ======

import { SuperAdminAggregator } from '../services/SuperAdminAggregator';

// GET /superadmin/properties - All properties across all agencies
export const getAllProperties = async (req: Request, res: Response) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    try {
        const properties = await SuperAdminAggregator.getAllProperties();
        res.json(properties);
    } catch (error: any) {
        console.error('Error fetching all properties:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /superadmin/clients - All clients across all agencies
export const getAllClients = async (req: Request, res: Response) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    try {
        const clients = await SuperAdminAggregator.getAllClients();
        res.json(clients);
    } catch (error: any) {
        console.error('Error fetching all clients:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /superadmin/agents - All agents across all agencies
export const getAllAgents = async (req: Request, res: Response) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    try {
        const agents = await SuperAdminAggregator.getAllAgents();
        res.json(agents);
    } catch (error: any) {
        console.error('Error fetching all agents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /superadmin/stats - Global statistics across all agencies
export const getGlobalStats = async (req: Request, res: Response) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    try {
        const stats = await SuperAdminAggregator.getGlobalStats();
        res.json(stats);
    } catch (error: any) {
        console.error('Error fetching global stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /superadmin/closure-ratio - Monthly closure ratio across all agencies
export const getGlobalMonthlyClosureRatio = async (req: Request, res: Response) => {
    if (req.user?.role !== 'super_admin') {
        return res.status(403).json({ message: 'Access denied. Super Admin only.' });
    }

    try {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const data = await SuperAdminAggregator.getMonthlyClosureRatio(year);
        res.json(data);
    } catch (error: any) {
        console.error('Error fetching monthly closure ratio:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
