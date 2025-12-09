import pool from '../config/database';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
    const name = 'Platform Super Admin';
    const role = 'super_admin';

    try {
        console.log(`Checking for Super Admin: ${email}`);

        // Check if exists
        const [existing] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);

        if (existing.length > 0) {
            console.log('✅ Super Admin user already exists.');

            // Optional: Update role if needed
            if (existing[0].role !== 'super_admin') {
                await pool.query('UPDATE users SET role = ? WHERE email = ?', ['super_admin', email]);
                console.log('🔄 Updated user role to super_admin');
            }
            return;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        await pool.query(
            `INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())`,
            [name, email, hashedPassword, role]
        );

        console.log(`
🎉 Super Admin Created Successfully!
----------------------------------
Email:    ${email}
Password: ${password}
Role:     ${role}
----------------------------------
You can now login at /login
`);

    } catch (error) {
        console.error('❌ Error creating Super Admin:', error);
    } finally {
        await pool.end();
    }
};

createSuperAdmin();
