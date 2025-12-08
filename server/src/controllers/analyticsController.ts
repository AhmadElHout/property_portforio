import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import pool from '../config/database'; // Fallback
import { Pool } from 'mysql2/promise';

// Helper to get the correct DB connection
const getDb = (req: Request): Pool => {
    return req.db || pool;
};

// Helper to apply role-based filters
const getRoleFilter = (req: Request) => {
    const user = req.user!;
    if (user.role === 'agent') {
        return { filter: 'AND p.agent_id = ?', param: user.id };
    }
    return { filter: '', param: null };
};

// Helper to compute budget range label from price
const getBudgetRange = (price: number): string => {
    if (price < 100000) return '0-100k';
    if (price < 200000) return '100-200k';
    if (price < 300000) return '200-300k';
    if (price < 500000) return '300-500k';
    return '500k+';
};

// Helper to compute age range label from construction year
const getAgeRange = (constructionYear: number | null): string => {
    if (!constructionYear) return 'Unknown';
    const age = new Date().getFullYear() - constructionYear;
    if (age < 5) return '0-5 years';
    if (age < 10) return '5-10 years';
    if (age < 20) return '10-20 years';
    return '20+ years';
};

export const getClosureRatio = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const year = req.query.year || new Date().getFullYear();
    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    try {
        const [addedRows] = await db.execute<RowDataPacket[]>(
            `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count 
             FROM properties p
             WHERE YEAR(created_at) = ? ${filter} 
             GROUP BY month`,
            param ? [year, param] : [year]
        );

        const [closedRows] = await db.execute<RowDataPacket[]>(
            `SELECT DATE_FORMAT(status_changed_at, '%Y-%m') as month, COUNT(*) as count 
             FROM properties p
             WHERE status = 'closed' AND YEAR(status_changed_at) = ? ${filter} 
             GROUP BY month`,
            param ? [year, param] : [year]
        );

        // Merge
        const months = new Set([...addedRows.map(r => r.month), ...closedRows.map(r => r.month)]);
        const result = Array.from(months).sort().map(month => {
            const added = addedRows.find(r => r.month === month)?.count || 0;
            const closed = closedRows.find(r => r.month === month)?.count || 0;
            return {
                month,
                properties_added: added,
                properties_closed: closed,
                closure_ratio: added > 0 ? Number((closed / added).toFixed(2)) : 0
            };
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching closure ratio:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getTimeToCloseByLocation = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    try {
        const query = `
            SELECT 
                city as location,
                AVG(DATEDIFF(status_changed_at, created_at)) as avg_days,
                COUNT(*) as total_closed
            FROM properties p
            WHERE status = 'closed' 
            AND status_changed_at IS NOT NULL 
            AND created_at IS NOT NULL
            ${filter}
            GROUP BY city
            ORDER BY total_closed DESC
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, param ? [param] : []);

        const result = rows.map(row => ({
            location: row.location,
            avg_days: Math.round(row.avg_days),
            total_closed: row.total_closed
        }));

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching time to close by location:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTimeToCloseByBudget = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    try {
        const query = `
            SELECT 
                price_usd,
                DATEDIFF(status_changed_at, created_at) as days_to_close
            FROM properties p
            WHERE status = 'closed' 
            AND status_changed_at IS NOT NULL 
            AND created_at IS NOT NULL
            AND price_usd IS NOT NULL
            ${filter}
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, param ? [param] : []);

        const ranges = [
            { label: '0-100k', min: 0, max: 100000 },
            { label: '100-200k', min: 100000, max: 200000 },
            { label: '200-300k', min: 200000, max: 300000 },
            { label: '300-500k', min: 300000, max: 500000 },
            { label: '500k+', min: 500000, max: Infinity }
        ];

        const result = ranges.map(range => {
            const matches = rows.filter(r => r.price_usd >= range.min && r.price_usd < range.max);
            const total = matches.length;
            const avg = total > 0
                ? Math.round(matches.reduce((sum, r) => sum + r.days_to_close, 0) / total)
                : 0;

            return {
                range: range.label,
                avg_days: avg,
                total_closed: total
            };
        }).filter(r => r.total_closed > 0);

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching time to close by budget:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTimeToCloseByAge = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    try {
        const query = `
            SELECT 
                construction_year,
                DATEDIFF(status_changed_at, created_at) as days_to_close
            FROM properties p
            WHERE status = 'closed' 
            AND status_changed_at IS NOT NULL 
            AND created_at IS NOT NULL
            AND construction_year IS NOT NULL
            ${filter}
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, param ? [param] : []);
        const currentYear = new Date().getFullYear();

        const ranges = [
            { label: '0-5 years', min: 0, max: 5 },
            { label: '5-10 years', min: 5, max: 10 },
            { label: '10-20 years', min: 10, max: 20 },
            { label: '20+ years', min: 20, max: Infinity }
        ];

        const result = ranges.map(range => {
            const matches = rows.filter(r => {
                const age = currentYear - r.construction_year;
                return age >= range.min && age < range.max;
            });
            const total = matches.length;
            const avg = total > 0
                ? Math.round(matches.reduce((sum, r) => sum + r.days_to_close, 0) / total)
                : 0;

            return {
                age_range: range.label,
                avg_days: avg,
                total_closed: total
            };
        }).filter(r => r.total_closed > 0);

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching time to close by age:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PART 3: Hot Preferences Dashboard
export const getHotPreferences = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    // Extract filters from query params
    const areaFilter = req.query.area ? `AND p.area = ?` : '';
    const typeFilter = req.query.property_type ? `AND p.property_type = ?` : '';

    const params: any[] = [];
    if (param) params.push(param);
    if (req.query.area) params.push(req.query.area);
    if (req.query.property_type) params.push(req.query.property_type);

    try {
        const query = `
            SELECT 
                p.area,
                p.price_usd,
                p.construction_year,
                p.property_type,
                COUNT(pl.client_id) as lead_count
            FROM properties p
            LEFT JOIN property_leads pl ON p.id = pl.property_id
            WHERE p.price_usd IS NOT NULL
            ${filter}
            ${areaFilter}
            ${typeFilter}
            GROUP BY p.id, p.area, p.price_usd, p.construction_year, p.property_type
            HAVING lead_count > 0
            ORDER BY lead_count DESC
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, params);

        // Compute ranges and aggregate
        const aggregated: Record<string, any> = {};

        rows.forEach(row => {
            const budgetRange = getBudgetRange(row.price_usd);
            const ageRange = getAgeRange(row.construction_year);
            const key = `${row.area}|${budgetRange}|${ageRange}|${row.property_type}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    area: row.area,
                    budget_range: budgetRange,
                    age_range: ageRange,
                    property_type: row.property_type,
                    lead_count: 0
                };
            }
            aggregated[key].lead_count += row.lead_count;
        });

        const result = Object.values(aggregated)
            .sort((a: any, b: any) => b.lead_count - a.lead_count);

        // Apply query param filters for budget_range and age_range
        let filteredResult = result;
        if (req.query.budget_range) {
            filteredResult = filteredResult.filter((item: any) => item.budget_range === req.query.budget_range);
        }
        if (req.query.age_range) {
            filteredResult = filteredResult.filter((item: any) => item.age_range === req.query.age_range);
        }

        res.json(filteredResult);
    } catch (error: any) {
        console.error('Error fetching hot preferences:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// PART 4: Property Farming Recommendations
export const getFarmingRecommendations = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    try {
        // Get all properties with leads
        const query = `
            SELECT 
                p.area,
                p.price_usd,
                p.construction_year,
                p.property_type,
                COUNT(pl.client_id) as lead_count
            FROM properties p
            LEFT JOIN property_leads pl ON p.id = pl.property_id
            WHERE p.price_usd IS NOT NULL
            ${filter}
            GROUP BY p.id, p.area, p.price_usd, p.construction_year, p.property_type
            HAVING lead_count > 0
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, param ? [param] : []);

        // Top locations
        const locationMap: Record<string, number> = {};
        rows.forEach(row => {
            locationMap[row.area] = (locationMap[row.area] || 0) + row.lead_count;
        });
        const topLocations = Object.entries(locationMap)
            .map(([area, lead_count]) => ({ area, lead_count }))
            .sort((a, b) => b.lead_count - a.lead_count)
            .slice(0, 5);

        // Top specs (aggregated by type, budget, age)
        const specsMap: Record<string, any> = {};
        rows.forEach(row => {
            const budgetRange = getBudgetRange(row.price_usd);
            const ageRange = getAgeRange(row.construction_year);
            const key = `${row.property_type}|${budgetRange}|${ageRange}`;

            if (!specsMap[key]) {
                specsMap[key] = {
                    property_type: row.property_type,
                    budget_range: budgetRange,
                    age_range: ageRange,
                    lead_count: 0
                };
            }
            specsMap[key].lead_count += row.lead_count;
        });

        const topSpecs = Object.values(specsMap)
            .sort((a: any, b: any) => b.lead_count - a.lead_count)
            .slice(0, 5);

        // Generate recommendations
        const recommendations: string[] = [];
        if (topLocations.length > 0) {
            const top = topLocations[0];
            recommendations.push(`Focus on ${top.area} — highest demand this month with ${top.lead_count} leads`);
        }
        if (topSpecs.length > 0) {
            const top: any = topSpecs[0];
            recommendations.push(`Target ${top.budget_range} ${top.property_type}s aged ${top.age_range}`);
        }
        const highDemandAreas = topLocations.filter(l => l.lead_count >= 10);
        if (highDemandAreas.length > 0) {
            recommendations.push(`Promote listings in areas with 10+ leads: ${highDemandAreas.map(l => l.area).join(', ')}`);
        }
        if (recommendations.length === 0) {
            recommendations.push('Not enough lead data to generate recommendations');
        }

        res.json({
            top_locations: topLocations,
            top_specs: topSpecs,
            recommendations
        });
    } catch (error: any) {
        console.error('Error fetching farming recommendations:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Property Type Distribution (for Donut Chart)
export const getPropertyTypeDistribution = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    try {
        const query = `
            SELECT 
                property_type,
                COUNT(*) as count
            FROM properties p
            WHERE 1=1 ${filter}
            GROUP BY property_type
            ORDER BY count DESC
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, param ? [param] : []);

        // Add colors for each type
        const colors: Record<string, string> = {
            'apartment': '#4f46e5',
            'villa': '#10b981',
            'office': '#f59e0b',
            'land': '#ef4444',
            'store': '#8b5cf6',
            'warehouse': '#06b6d4',
            'building': '#ec4899'
        };

        const result = rows.map(row => ({
            property_type: row.property_type,
            count: row.count,
            color: colors[row.property_type.toLowerCase()] || '#6b7280'
        }));

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching property type distribution:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Property Status Distribution (for Donut Chart)
export const getPropertyStatusDistribution = async (req: Request, res: Response) => {
    if (req.user?.role === 'super_admin') return res.status(403).json({ message: 'Not available for Super Admin' });

    const db = getDb(req);
    const { filter, param } = getRoleFilter(req);

    try {
        const query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM properties p
            WHERE 1=1 ${filter}
            GROUP BY status
            ORDER BY count DESC
        `;

        const [rows] = await db.execute<RowDataPacket[]>(query, param ? [param] : []);

        const result = rows.map(row => ({
            status: row.status,
            count: row.count
        }));

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching property status distribution:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
