import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Cache for agency database pools
const agencyPools = new Map<number, Pool>();
let platformPool: Pool | null = null;

// Platform DB Configuration
const platformDbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'platform_db', // Dedicated platform DB
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

/**
 * Get the singleton connection pool for the Platform DB
 */
export const getPlatformDb = async (): Promise<Pool> => {
    if (!platformPool) {
        platformPool = mysql.createPool(platformDbConfig);
        // Test connection
        try {
            const connection = await platformPool.getConnection();
            connection.release();
            console.log('Connected to Platform DB');
        } catch (error) {
            console.error('Failed to connect to Platform DB:', error);
            throw error;
        }
    }
    return platformPool;
};

/**
 * Get a connection pool for a specific Agency DB
 * Uses caching to avoid creating too many pools
 */
export const getAgencyDb = async (agencyId: number): Promise<Pool> => {
    if (agencyPools.has(agencyId)) {
        return agencyPools.get(agencyId)!;
    }

    // Fetch agency DB details from Platform DB
    const platformDb = await getPlatformDb();
    const [rows] = await platformDb.execute<any[]>('SELECT * FROM agencies WHERE id = ?', [agencyId]);

    if (rows.length === 0) {
        throw new Error(`Agency with ID ${agencyId} not found`);
    }

    const agency = rows[0];

    // Create new pool for this agency
    const pool = mysql.createPool({
        host: agency.db_host || 'localhost',
        user: agency.db_user,
        password: agency.db_password, // In a real app, decrypt this
        database: agency.database_name,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // Cache it
    agencyPools.set(agencyId, pool);
    return pool;
};

/**
 * Helper to run a query across ALL agency databases
 * Useful for global analytics or maintenance
 */
export const queryAllAgencies = async (queryString: string, params: any[] = []) => {
    const platformDb = await getPlatformDb();
    const [agencies] = await platformDb.execute<any[]>('SELECT id, name FROM agencies WHERE status = "active"');

    const results = [];

    for (const agency of agencies) {
        try {
            const db = await getAgencyDb(agency.id);
            const [rows] = await db.execute(queryString, params);
            results.push({
                agencyId: agency.id,
                agencyName: agency.name,
                data: rows
            });
        } catch (error: any) {
            console.error(`Failed to query agency ${agency.name} (${agency.id}):`, error.message);
            results.push({
                agencyId: agency.id,
                agencyName: agency.name,
                error: error.message
            });
        }
    }

    return results;
};
