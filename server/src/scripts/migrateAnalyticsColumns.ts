import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const migrateAnalyticsColumns = async () => {
    console.log('Starting Analytics Columns Migration...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'property_portforio'
    });

    try {
        // Check if columns exist
        const [columns] = await connection.execute<any[]>(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'properties' AND COLUMN_NAME IN ('status_changed_at', 'construction_year')`,
            [process.env.DB_NAME || 'property_portforio']
        );

        const existingColumns = columns.map(c => c.COLUMN_NAME);

        if (!existingColumns.includes('status_changed_at')) {
            await connection.execute('ALTER TABLE properties ADD COLUMN status_changed_at TIMESTAMP NULL');
            console.log('✓ Added status_changed_at column');

            // Backfill: set status_changed_at to updated_at for closed properties as a best guess
            await connection.execute("UPDATE properties SET status_changed_at = updated_at WHERE status = 'closed'");
            console.log('✓ Backfilled status_changed_at for closed properties');
        } else {
            console.log('✓ status_changed_at column already exists');
        }

        if (!existingColumns.includes('construction_year')) {
            await connection.execute('ALTER TABLE properties ADD COLUMN construction_year INT NULL');
            console.log('✓ Added construction_year column');
        } else {
            console.log('✓ construction_year column already exists');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
};

migrateAnalyticsColumns();
