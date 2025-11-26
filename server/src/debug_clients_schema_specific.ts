
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
    queueLimit: 0
});

async function checkSchema() {
    try {
        const [rows] = await pool.execute("SHOW COLUMNS FROM clients WHERE Field IN ('agent_id', 'type', 'status')");
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

checkSchema();
