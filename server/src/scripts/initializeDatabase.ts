import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
};

async function initializeDatabase() {
    let connection;

    try {
        // Connect to MySQL without specifying a database
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✓ Connected to MySQL');

        // ============================================
        // STEP 1: Create platform_db
        // ============================================
        console.log('\n📦 Creating platform_db...');
        await connection.query('CREATE DATABASE IF NOT EXISTS platform_db');
        await connection.query('USE platform_db');

        // Create super_admin_users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS super_admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('  ✓ Created super_admin_users table');

        // Create agencies table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS agencies (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                database_name VARCHAR(255) NOT NULL,
                db_host VARCHAR(255) DEFAULT 'localhost',
                db_user VARCHAR(255) NOT NULL,
                db_password VARCHAR(255),
                owner_admin_id INT,
                status ENUM('active', 'inactive') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('  ✓ Created agencies table');

        // Create agency_performance_summary table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS agency_performance_summary (
                agency_id INT PRIMARY KEY,
                total_properties INT DEFAULT 0,
                avg_price DECIMAL(15, 2) DEFAULT 0,
                avg_area DECIMAL(10, 2) DEFAULT 0,
                properties_by_type JSON,
                leads_count INT DEFAULT 0,
                last_sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ Created agency_performance_summary table');

        // Seed super admin
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@platform.com';
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

        const [existingSuperAdmin] = await connection.query<any[]>(
            'SELECT id FROM super_admin_users WHERE email = ?',
            [superAdminEmail]
        );

        if (existingSuperAdmin.length === 0) {
            await connection.query(
                'INSERT INTO super_admin_users (name, email, password_hash) VALUES (?, ?, ?)',
                ['Super Admin', superAdminEmail, hashedPassword]
            );
            console.log('  ✓ Created super admin user:', superAdminEmail);
        } else {
            console.log('  ℹ Super admin already exists');
        }

        // ============================================
        // STEP 2: Create property_portforio database
        // ============================================
        console.log('\n📦 Creating property_portforio database...');
        await connection.query('CREATE DATABASE IF NOT EXISTS property_portforio');
        await connection.query('USE property_portforio');

        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('owner', 'agent', 'curator') NOT NULL,
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('  ✓ Created users table');

        // Create properties table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS properties (
                id INT AUTO_INCREMENT PRIMARY KEY,
                agent_id INT NOT NULL,
                property_type VARCHAR(50) NOT NULL,
                purpose ENUM('sale', 'rent', 'both') NOT NULL,
                furnished ENUM('yes', 'no', 'partially') NOT NULL,
                city VARCHAR(100) NOT NULL,
                area VARCHAR(100) NOT NULL,
                ownership_type VARCHAR(100) NOT NULL,
                ownership_notes TEXT,
                built_up_area DECIMAL(10, 2),
                land_area DECIMAL(10, 2),
                bedrooms INT,
                bathrooms INT,
                floor_level INT,
                has_24_7_electricity BOOLEAN DEFAULT FALSE,
                has_generator BOOLEAN DEFAULT FALSE,
                has_elevator BOOLEAN DEFAULT FALSE,
                has_parking BOOLEAN DEFAULT FALSE,
                price_usd DECIMAL(15, 2) NOT NULL,
                notes TEXT,
                maid_room BOOLEAN DEFAULT FALSE,
                balcony BOOLEAN DEFAULT FALSE,
                terrace BOOLEAN DEFAULT FALSE,
                heating_system VARCHAR(100),
                ac_system VARCHAR(100),
                water_tank BOOLEAN DEFAULT FALSE,
                concierge BOOLEAN DEFAULT FALSE,
                security BOOLEAN DEFAULT FALSE,
                gym BOOLEAN DEFAULT FALSE,
                pool BOOLEAN DEFAULT FALSE,
                zoning VARCHAR(100),
                occupancy_status VARCHAR(100),
                payment_method VARCHAR(100),
                commission VARCHAR(100),
                status ENUM('active', 'on_hold', 'archived') DEFAULT 'active',
                content_status ENUM('new', 'in_review', 'ready', 'needs_fix') DEFAULT 'new',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (agent_id) REFERENCES users(id)
            )
        `);
        console.log('  ✓ Created properties table');

        // Create property_images table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS property_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                property_id INT NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
            )
        `);
        console.log('  ✓ Created property_images table');

        // Create clients table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS clients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                agent_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                type ENUM('owner', 'lead') NOT NULL,
                phone VARCHAR(50),
                email VARCHAR(255),
                whatsapp VARCHAR(50),
                status VARCHAR(50) DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (agent_id) REFERENCES users(id)
            )
        `);
        console.log('  ✓ Created clients table');

        // Create curator_feedback table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS curator_feedback (
                id INT AUTO_INCREMENT PRIMARY KEY,
                property_id INT NOT NULL,
                curator_id INT NOT NULL,
                comments TEXT,
                requested_changes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                FOREIGN KEY (curator_id) REFERENCES users(id)
            )
        `);
        console.log('  ✓ Created curator_feedback table');

        // Create property_internal_notes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS property_internal_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                property_id INT NOT NULL,
                agent_id INT NOT NULL,
                note TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                FOREIGN KEY (agent_id) REFERENCES users(id)
            )
        `);
        console.log('  ✓ Created property_internal_notes table');

        // Create property_status_history table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS property_status_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                property_id INT NOT NULL,
                user_id INT NOT NULL,
                old_status VARCHAR(50),
                new_status VARCHAR(50),
                status_type ENUM('operational', 'content') NOT NULL,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('  ✓ Created property_status_history table');

        // Seed owner user for the default agency
        const ownerEmail = 'owner@agency.com';
        const ownerPassword = 'owner123';
        const ownerHashedPassword = await bcrypt.hash(ownerPassword, 10);

        const [existingOwner] = await connection.query<any[]>(
            'SELECT id FROM users WHERE email = ?',
            [ownerEmail]
        );

        let ownerId;
        if (existingOwner.length === 0) {
            const [result] = await connection.query<any>(
                'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['Agency Owner', ownerEmail, ownerHashedPassword, 'owner']
            );
            ownerId = result.insertId;
            console.log('  ✓ Created owner user:', ownerEmail);
        } else {
            ownerId = existingOwner[0].id;
            console.log('  ℹ Owner user already exists');
        }

        // Create some sample agents
        const agentEmail = 'agent@agency.com';
        const agentPassword = 'agent123';
        const agentHashedPassword = await bcrypt.hash(agentPassword, 10);

        const [existingAgent] = await connection.query<any[]>(
            'SELECT id FROM users WHERE email = ?',
            [agentEmail]
        );

        if (existingAgent.length === 0) {
            await connection.query(
                'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['John Agent', agentEmail, agentHashedPassword, 'agent']
            );
            console.log('  ✓ Created agent user:', agentEmail);
        } else {
            console.log('  ℹ Agent user already exists');
        }

        // ============================================
        // STEP 3: Register agency in platform_db
        // ============================================
        console.log('\n📦 Registering agency in platform_db...');
        await connection.query('USE platform_db');

        const [existingAgency] = await connection.query<any[]>(
            'SELECT id FROM agencies WHERE database_name = ?',
            ['property_portforio']
        );

        if (existingAgency.length === 0) {
            await connection.query(
                `INSERT INTO agencies (name, database_name, db_host, db_user, db_password, owner_admin_id, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    'Default Agency',
                    'property_portforio',
                    process.env.DB_HOST || 'localhost',
                    process.env.DB_USER || 'root',
                    process.env.DB_PASSWORD || '',
                    ownerId,
                    'active'
                ]
            );
            console.log('  ✓ Registered default agency');
        } else {
            console.log('  ℹ Agency already registered');
        }

        console.log('\n✅ Database initialization complete!');
        console.log('\n📝 Login Credentials:');
        console.log('  Super Admin:');
        console.log('    Email:', superAdminEmail);
        console.log('    Password:', superAdminPassword);
        console.log('  Agency Owner:');
        console.log('    Email:', ownerEmail);
        console.log('    Password:', ownerPassword);
        console.log('  Agent:');
        console.log('    Email:', agentEmail);
        console.log('    Password:', agentPassword);

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization
initializeDatabase()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to initialize:', error);
        process.exit(1);
    });
