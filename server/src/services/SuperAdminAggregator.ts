import pool, { getAllAgencyDatabases } from '../config/database';
import { RowDataPacket } from 'mysql2';

export class SuperAdminAggregator {
    /**
     * Get all properties from all agency databases
     */
    static async getAllProperties() {
        const databases = await getAllAgencyDatabases();
        const allProperties: any[] = [];

        for (const db of databases) {
            try {
                const query = `
                    SELECT 
                        p.id,
                        p.property_type,
                        p.purpose,
                        p.city,
                        p.area,
                        p.price_usd,
                        p.status,
                        p.created_at,
                        p.status_changed_at,
                        u.name as agent_name,
                        '${db}' as source_agency
                    FROM ${db}.properties p
                    LEFT JOIN ${db}.users u ON p.agent_id = u.id
                    ORDER BY p.created_at DESC
                `;

                const [rows] = await pool.query<RowDataPacket[]>(query);
                allProperties.push(...rows);
            } catch (error: any) {
                console.error(`Error fetching properties from ${db}:`, error.message);
            }
        }

        return allProperties;
    }

    /**
     * Get all clients from all agency databases
     */
    static async getAllClients() {
        const databases = await getAllAgencyDatabases();
        const allClients: any[] = [];

        for (const db of databases) {
            try {
                const query = `
                    SELECT 
                        c.id,
                        c.name,
                        c.phone,
                        c.email,
                        c.notes,
                        c.created_at,
                        '${db}' as source_agency
                    FROM ${db}.clients c
                    ORDER BY c.created_at DESC
                `;

                const [rows] = await pool.query<RowDataPacket[]>(query);
                allClients.push(...rows);
            } catch (error: any) {
                console.error(`Error fetching clients from ${db}:`, error.message);
            }
        }

        return allClients;
    }

    /**
     * Get all agents from all agency databases
     */
    static async getAllAgents() {
        const databases = await getAllAgencyDatabases();
        const allAgents: any[] = [];

        for (const db of databases) {
            try {
                const query = `
                    SELECT 
                        u.id,
                        u.name,
                        u.email,
                        u.role,
                        u.created_at,
                        '${db}' as source_agency
                    FROM ${db}.users u
                    WHERE u.role = 'agent'
                    ORDER BY u.created_at DESC
                `;

                const [rows] = await pool.query<RowDataPacket[]>(query);
                allAgents.push(...rows);
            } catch (error: any) {
                console.error(`Error fetching agents from ${db}:`, error.message);
            }
        }

        return allAgents;
    }

    /**
     * Get global statistics across all agencies
     */
    static async getGlobalStats() {
        const databases = await getAllAgencyDatabases();

        let totalProperties = 0;
        let totalClosed = 0;
        let totalAgents = 0;
        let totalClients = 0;
        let propertiesThisMonth = 0;
        const topLocations: Record<string, number> = {};
        const topPriceRanges: Record<string, number> = {};

        for (const db of databases) {
            try {
                // Count properties
                const [propCount] = await pool.query<RowDataPacket[]>(
                    `SELECT COUNT(*) as count FROM ${db}.properties`
                );
                totalProperties += propCount[0].count;

                // Count closed properties
                const [closedCount] = await pool.query<RowDataPacket[]>(
                    `SELECT COUNT(*) as count FROM ${db}.properties WHERE status = 'closed'`
                );
                totalClosed += closedCount[0].count;

                // Count agents
                const [agentCount] = await pool.query<RowDataPacket[]>(
                    `SELECT COUNT(*) as count FROM ${db}.users WHERE role = 'agent'`
                );
                totalAgents += agentCount[0].count;

                // Count clients
                const [clientCount] = await pool.query<RowDataPacket[]>(
                    `SELECT COUNT(*) as count FROM ${db}.clients`
                );
                totalClients += clientCount[0].count;

                // Properties this month
                const [thisMonth] = await pool.query<RowDataPacket[]>(
                    `SELECT COUNT(*) as count FROM ${db}.properties 
                     WHERE YEAR(created_at) = YEAR(CURDATE()) 
                     AND MONTH(created_at) = MONTH(CURDATE())`
                );
                propertiesThisMonth += thisMonth[0].count;

                // Top locations
                const [locations] = await pool.query<RowDataPacket[]>(
                    `SELECT area, COUNT(*) as count FROM ${db}.properties 
                     WHERE area IS NOT NULL AND area != ''
                     GROUP BY area`
                );
                locations.forEach((loc: any) => {
                    topLocations[loc.area] = (topLocations[loc.area] || 0) + loc.count;
                });

                // Price ranges
                const [properties] = await pool.query<RowDataPacket[]>(
                    `SELECT price_usd FROM ${db}.properties WHERE price_usd > 0`
                );
                properties.forEach((prop: any) => {
                    const range = this.getPriceRange(prop.price_usd);
                    topPriceRanges[range] = (topPriceRanges[range] || 0) + 1;
                });

            } catch (error: any) {
                console.error(`Error fetching stats from ${db}:`, error.message);
            }
        }

        // Convert to arrays and sort
        const topLocationsArray = Object.entries(topLocations)
            .map(([location, count]) => ({ location, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const topPriceRangesArray = Object.entries(topPriceRanges)
            .map(([range, count]) => ({ range, count }))
            .sort((a, b) => b.count - a.count);

        return {
            total_properties: totalProperties,
            total_closed: totalClosed,
            total_agents: totalAgents,
            total_clients: totalClients,
            properties_this_month: propertiesThisMonth,
            closure_rate: totalProperties > 0 ? ((totalClosed / totalProperties) * 100).toFixed(2) : '0.00',
            top_locations: topLocationsArray,
            top_price_ranges: topPriceRangesArray,
            databases_count: databases.length,
            databases: databases
        };
    }

    /**
     * Get monthly closure ratio across all agencies
     */
    static async getMonthlyClosureRatio(year: number) {
        const databases = await getAllAgencyDatabases();
        const monthlyData: Record<string, { added: number; closed: number }> = {};

        for (let month = 1; month <= 12; month++) {
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            monthlyData[monthKey] = { added: 0, closed: 0 };
        }

        for (const db of databases) {
            try {
                // Properties added per month
                const [addedRows] = await pool.query<RowDataPacket[]>(
                    `SELECT 
                        DATE_FORMAT(created_at, '%Y-%m') as month,
                        COUNT(*) as count
                     FROM ${db}.properties
                     WHERE YEAR(created_at) = ?
                     GROUP BY DATE_FORMAT(created_at, '%Y-%m')`,
                    [year]
                );

                addedRows.forEach((row: any) => {
                    if (monthlyData[row.month]) {
                        monthlyData[row.month].added += row.count;
                    }
                });

                // Properties closed per month
                const [closedRows] = await pool.query<RowDataPacket[]>(
                    `SELECT 
                        DATE_FORMAT(status_changed_at, '%Y-%m') as month,
                        COUNT(*) as count
                     FROM ${db}.properties
                     WHERE status = 'closed'
                     AND status_changed_at IS NOT NULL
                     AND YEAR(status_changed_at) = ?
                     GROUP BY DATE_FORMAT(status_changed_at, '%Y-%m')`,
                    [year]
                );

                closedRows.forEach((row: any) => {
                    if (monthlyData[row.month]) {
                        monthlyData[row.month].closed += row.count;
                    }
                });

            } catch (error: any) {
                console.error(`Error fetching monthly data from ${db}:`, error.message);
            }
        }

        // Convert to array format
        return Object.entries(monthlyData).map(([month, data]) => ({
            month,
            properties_added: data.added,
            properties_closed: data.closed,
            closure_ratio: data.added > 0 ? data.closed / data.added : 0
        }));
    }

    /**
     * Helper: Get price range category
     */
    private static getPriceRange(price: number): string {
        if (price < 100000) return 'Under 100k';
        if (price < 200000) return '100k-200k';
        if (price < 300000) return '200k-300k';
        if (price < 500000) return '300k-500k';
        if (price < 1000000) return '500k-1M';
        return 'Above 1M';
    }
}
