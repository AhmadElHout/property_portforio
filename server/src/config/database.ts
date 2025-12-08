import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'property_portforio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    typeCast: true
});

// Test all agency database connections (for Super Admin)
export async function testAllAgenciesConnection() {
    try {
        console.log('\n=== Testing Agency Database Connections ===');

        // Get all agency databases
        const [rows] = await pool.query("SHOW DATABASES LIKE 'agency_%'");

        if (!Array.isArray(rows) || rows.length === 0) {
            console.log('⚠ No agency_* databases found. Using single database:', process.env.DB_NAME);
            console.log('Current database structure is single-tenant.');
            return;
        }

        console.log(`Detected ${rows.length} agency database(s):`);

        for (const row of rows as any[]) {
            const dbName = row[Object.keys(row)[0]];
            try {
                // Test connection and count properties
                const [countResult] = await pool.query(`SELECT COUNT(*) as count FROM ${dbName}.properties`);
                const count = (countResult as any[])[0].count;
                console.log(`  ✔ ${dbName}: ${count} properties`);
            } catch (err: any) {
                console.error(`  ✖ Error connecting to ${dbName}:`, err.message);
            }
        }

        console.log('=== Database Connection Test Complete ===\n');
    } catch (error) {
        console.error('Error testing database connections:', error);
    }
}

// Get list of all agency databases
export async function getAllAgencyDatabases(): Promise<string[]> {
    try {
        const [rows] = await pool.query("SHOW DATABASES LIKE 'agency_%'");

        if (!Array.isArray(rows) || rows.length === 0) {
            // If no agency databases, return the main database
            return [process.env.DB_NAME || 'property_portforio'];
        }

        return (rows as any[]).map(row => row[Object.keys(row)[0]]);
    } catch (error) {
        console.error('Error getting agency databases:', error);
        return [process.env.DB_NAME || 'property_portforio'];
    }
}

export default pool;
