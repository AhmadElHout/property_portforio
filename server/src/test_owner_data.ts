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

async function testPropertyData() {
    try {
        const [properties] = await pool.execute(
            `SELECT p.*, u.name as agent_name, 
                   c.name as owner_name, c.phone as owner_phone
            FROM properties p 
            JOIN users u ON p.agent_id = u.id 
            LEFT JOIN clients c ON p.owner_id = c.id
            LIMIT 3`
        );

        console.log('Sample properties with owner data:');
        console.log(JSON.stringify(properties, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

testPropertyData();
