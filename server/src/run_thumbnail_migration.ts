import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'property_portforio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

async function runMigration() {
    try {
        const sqlPath = 'C:/Users/Ahmad/.gemini/antigravity/brain/e9787ab2-ae15-4fb4-afc7-e930af384678/add_thumbnail_id.sql';
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running thumbnail_id migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');
    } catch (error: any) {
        console.error('Migration failed:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration();
