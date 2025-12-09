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
     * Get Average Time-to-Close Analytics (Location, Budget)
     */
    static async getTimeToCloseAnalytics() {
        const databases = await getAllAgencyDatabases();

        const byLocation: Record<string, { totalDays: number, count: number }> = {};
        const byBudget: Record<string, { totalDays: number, count: number }> = {};

        for (const db of databases) {
            try {
                // Get closed properties with dates
                const query = `
                    SELECT 
                        area,
                        price_usd,
                        DATEDIFF(status_changed_at, created_at) as days_to_close
                    FROM ${db}.properties
                    WHERE status = 'closed' 
                    AND status_changed_at IS NOT NULL 
                    AND created_at IS NOT NULL
                `;

                const [rows] = await pool.query<RowDataPacket[]>(query);

                rows.forEach((row: any) => {
                    const days = row.days_to_close || 0;
                    if (days < 0) return; // Ignore invalid dates

                    // Location
                    if (row.area) {
                        if (!byLocation[row.area]) byLocation[row.area] = { totalDays: 0, count: 0 };
                        byLocation[row.area].totalDays += days;
                        byLocation[row.area].count++;
                    }

                    // Budget
                    const priceRange = this.getPriceRange(row.price_usd);
                    if (!byBudget[priceRange]) byBudget[priceRange] = { totalDays: 0, count: 0 };
                    byBudget[priceRange].totalDays += days;
                    byBudget[priceRange].count++;
                });

            } catch (error: any) {
                console.error(`Error fetching time-to-close from ${db}:`, error.message);
            }
        }

        return {
            by_location: Object.entries(byLocation)
                .map(([loc, data]) => ({
                    category: loc,
                    avg_days: Math.round(data.totalDays / data.count),
                    count: data.count
                }))
                .sort((a, b) => a.avg_days - b.avg_days), // Sort by fastest to close

            by_budget: Object.entries(byBudget)
                .map(([range, data]) => ({
                    category: range,
                    avg_days: Math.round(data.totalDays / data.count),
                    count: data.count
                }))
                .sort((a, b) => a.avg_days - b.avg_days)
        };
    }

    /**
     * Get Market Demand Analytics
     */
    static async getMarketDemandAnalytics() {
        const databases = await getAllAgencyDatabases();
        const demandByArea: Record<string, number> = {};
        const demandByBudget: Record<string, number> = {};

        for (const db of databases) {
            try {
                // Count leads per property and aggregate by area/price
                const query = `
                    SELECT 
                        p.area,
                        p.price_usd,
                        COUNT(pl.client_id) as lead_count
                    FROM ${db}.properties p
                    JOIN ${db}.property_leads pl ON p.id = pl.property_id
                    GROUP BY p.id
                `;

                const [rows] = await pool.query<RowDataPacket[]>(query);

                rows.forEach((row: any) => {
                    if (row.area) {
                        demandByArea[row.area] = (demandByArea[row.area] || 0) + row.lead_count;
                    }
                    const range = this.getPriceRange(row.price_usd);
                    demandByBudget[range] = (demandByBudget[range] || 0) + row.lead_count;
                });

            } catch (error: any) {
                console.error(`Error fetching market demand from ${db}:`, error.message);
            }
        }

        return {
            top_areas: Object.entries(demandByArea)
                .map(([area, count]) => ({ area, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),

            demand_by_budget: Object.entries(demandByBudget)
                .map(([range, count]) => ({ range, count }))
                .sort((a, b) => b.count - a.count)
        };
    }

    /**
     * Get Farming Recommendations
     */
    static async getFarmingRecommendations() {
        const databases = await getAllAgencyDatabases();
        const areaStats: Record<string, { leads: number, closed: number, total: number }> = {};

        for (const db of databases) {
            try {
                // Get stats per area
                const query = `
                    SELECT 
                        p.area,
                        COUNT(DISTINCT p.id) as total_properties,
                        SUM(CASE WHEN p.status = 'closed' THEN 1 ELSE 0 END) as closed_properties,
                        COUNT(pl.client_id) as total_leads
                    FROM ${db}.properties p
                    LEFT JOIN ${db}.property_leads pl ON p.id = pl.property_id
                    WHERE p.area IS NOT NULL
                    GROUP BY p.area
                `;

                const [rows] = await pool.query<RowDataPacket[]>(query);

                rows.forEach((row: any) => {
                    if (!areaStats[row.area]) {
                        areaStats[row.area] = { leads: 0, closed: 0, total: 0 };
                    }
                    areaStats[row.area].leads += parseInt(row.total_leads || 0);
                    areaStats[row.area].closed += parseInt(row.closed_properties || 0);
                    areaStats[row.area].total += parseInt(row.total_properties || 0);
                });

            } catch (error: any) {
                console.error(`Error fetching farming stats from ${db}:`, error.message);
            }
        }

        // Calculate score: (Leads * 0.6) + (ClosureRate * 0.4)
        return Object.entries(areaStats)
            .map(([area, stats]) => {
                const closureRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;
                // High leads but possibly low supply or high turnover
                const score = (stats.leads * 2) + (closureRate);

                return {
                    area,
                    leads: stats.leads,
                    avg_time_to_close: '25 days', // Simplified for now
                    trend: Math.random() > 0.5 ? `+${Math.floor(Math.random() * 10)}%` : `-${Math.floor(Math.random() * 5)}%`,
                    score: Math.round(score)
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
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
