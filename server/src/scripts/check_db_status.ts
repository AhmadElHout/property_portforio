import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkDb() {
    console.log('Checking database configuration...');
    console.log('DB_NAME:', process.env.DB_NAME || 'property_portforio');

    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'property_portforio',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
    });

    try {
        const connection = await pool.getConnection();
        console.log('Connected to database!');

        // 1. Check Table Schema
        const [rows] = await connection.query("SHOW CREATE TABLE users");
        console.log('\n--- TABLE SCHEMA ---');
        // @ts-ignore
        console.log(rows[0]['Create Table']);

        // 2. Check Triggers
        const [triggers] = await connection.query("SHOW TRIGGERS LIKE 'users'");
        console.log('\n--- TRIGGERS ---');
        console.log(triggers);

        // 3. Try Insert
        console.log('\n--- ATTEMPTING INSERT ---');
        try {
            const name = 'Test Script User';
            const email = 'test_script_' + Date.now() + '@owner.com';
            const passwordHash = 'hash123';
            const role = 'owner';

            const sql = `INSERT INTO users (name, email, password_hash, role) VALUES (${connection.escape(name)}, ${connection.escape(email)}, ${connection.escape(passwordHash)}, ${connection.escape(role)})`;
            console.log('SQL:', sql);

            await connection.query(sql);
            console.log('SUCCESS: User created!');

            // Cleanup
            await connection.query('DELETE FROM users WHERE email = ?', [email]);
        } catch (err: any) {
            console.error('FAILURE: Insert failed!');
            console.error(err.message);
        }

        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err);
    } finally {
        await pool.end();
    }
}

checkDb();
