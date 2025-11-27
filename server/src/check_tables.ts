import pool from './config/database';

const checkTables = async () => {
    try {
        const [rows] = await pool.execute('DESCRIBE property_leads');
        console.log('Tables:', rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkTables();
