import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const fixPassword = async () => {
    console.log('Fixing Super Admin Password...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: 'platform_db'
    });

    try {
        const password = 'admin123';
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        console.log(`Generated new hash for '${password}'`);

        // Update the user
        const [result] = await connection.execute(
            'UPDATE super_admin_users SET password_hash = ? WHERE email = ?',
            [hash, 'super@platform.com']
        );

        // Check if user existed
        const [rows] = await connection.execute<any[]>('SELECT * FROM super_admin_users WHERE email = ?', ['super@platform.com']);

        if (rows.length === 0) {
            console.log('User not found, creating it...');
            await connection.execute(
                'INSERT INTO super_admin_users (name, email, password_hash) VALUES (?, ?, ?)',
                ['Super Admin', 'super@platform.com', hash]
            );
            console.log('User created.');
        } else {
            console.log('User password updated.');
        }

    } catch (error) {
        console.error('Failed to fix password:', error);
    } finally {
        await connection.end();
    }
};

fixPassword();
