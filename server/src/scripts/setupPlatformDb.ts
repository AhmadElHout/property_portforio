import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const setupPlatformDb = async () => {
    console.log('Starting Platform DB Setup...');

    // 1. Connect to MySQL Server (no specific DB)
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        // 2. Create Database
        await connection.query('CREATE DATABASE IF NOT EXISTS platform_db');
        console.log('✓ Database platform_db created or exists');

        // 3. Switch to platform_db
        await connection.changeUser({ database: 'platform_db' });

        // 4. Read and Run Schema
        const schemaPath = path.join(__dirname, '../../platform_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon to run statements individually
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            await connection.query(statement);
        }
        console.log('✓ Schema applied successfully');

        // 5. Seed Initial Agency (Your existing DB)
        // Check if it already exists
        const [rows] = await connection.execute<any[]>('SELECT * FROM agencies WHERE database_name = ?', [process.env.DB_NAME]);
        
        if (rows.length === 0) {
            await connection.execute(
                `INSERT INTO agencies (name, database_name, db_host, db_user, db_password, status) 
                 VALUES (?, ?, ?, ?, ?, 'active')`,
                [
                    'Main Agency', 
                    process.env.DB_NAME || 'property_portforio',
                    process.env.DB_HOST || 'localhost',
                    process.env.DB_USER || 'root',
                    process.env.DB_PASSWORD || ''
                ]
            );
            console.log(`✓ Seeded initial agency: ${process.env.DB_NAME}`);
        } else {
            console.log('✓ Initial agency already exists');
        }

        // 6. Seed Super Admin User if not exists
        const [admins] = await connection.execute<any[]>('SELECT * FROM super_admin_users WHERE email = ?', ['super@platform.com']);
        if (admins.length === 0) {
            // Password: admin123 (hashed)
            const hashedPassword = '$2b$10$EpOoT.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w.w'; 
            await connection.execute(
                'INSERT INTO super_admin_users (name, email, password_hash) VALUES (?, ?, ?)',
                ['Super Admin', 'super@platform.com', hashedPassword]
            );
            console.log('✓ Seeded default Super Admin (super@platform.com / admin123)');
        }

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await connection.end();
    }
};

setupPlatformDb();
