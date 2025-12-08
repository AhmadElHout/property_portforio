import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'property_portforio'
};

async function seedSampleData() {
    let connection;

    try {
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✓ Connected to property_portforio database');

        // Get the agent user ID
        const [agents] = await connection.query<any[]>(
            'SELECT id, name FROM users WHERE role = "agent" LIMIT 1'
        );

        if (agents.length === 0) {
            console.error('❌ No agent found in database. Please run db:setup first.');
            return;
        }

        const agentId = agents[0].id;
        console.log(`  ✓ Found agent: ${agents[0].name} (ID: ${agentId})`);

        // Add sample clients
        console.log('\n📦 Adding sample clients...');

        const sampleClients = [
            { name: 'Ahmad Khalil', type: 'owner', phone: '+961 3 123 456', email: 'ahmad@example.com', whatsapp: '+961 3 123 456' },
            { name: 'Sara Hassan', type: 'lead', phone: '+961 3 234 567', email: 'sara@example.com', whatsapp: '+961 3 234 567' },
            { name: 'Mohamed Ali', type: 'owner', phone: '+961 3 345 678', email: 'mohamed@example.com', whatsapp: '+961 3 345 678' },
            { name: 'Layla Mansour', type: 'lead', phone: '+961 3 456 789', email: 'layla@example.com', whatsapp: '+961 3 456 789' },
            { name: 'Karim Abdallah', type: 'owner', phone: '+961 3 567 890', email: 'karim@example.com', whatsapp: '+961 3 567 890' }
        ];

        for (const client of sampleClients) {
            const [existing] = await connection.query<any[]>(
                'SELECT id FROM clients WHERE email = ?',
                [client.email]
            );

            if (existing.length === 0) {
                await connection.query(
                    'INSERT INTO clients (agent_id, name, type, phone, email, whatsapp, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [agentId, client.name, client.type, client.phone, client.email, client.whatsapp, 'active']
                );
                console.log(`  ✓ Added ${client.name} (${client.type})`);
            }
        }

        // Add sample properties
        console.log('\n📦 Adding sample properties...');

        const sampleProperties = [
            {
                property_type: 'Apartment',
                purpose: 'sale',
                furnished: 'yes',
                city: 'Beirut',
                area: 'Achrafieh',
                ownership_type: 'Individual',
                built_up_area: 150,
                land_area: 0,
                bedrooms: 3,
                bathrooms: 2,
                floor_level: 4,
                has_24_7_electricity: true,
                has_generator: true,
                has_elevator: true,
                has_parking: true,
                price_usd: 250000,
                notes: 'Spacious apartment with sea view',
                status: 'active',
                content_status: 'ready',
                balcony: true,
                ac_system: 'Central AC',
                concierge: true,
                security: true
            },
            {
                property_type: 'Villa',
                purpose: 'rent',
                furnished: 'no',
                city: 'Beirut',
                area: 'Verdun',
                ownership_type: 'Individual',
                built_up_area: 300,
                land_area: 400,
                bedrooms: 5,
                bathrooms: 4,
                floor_level: 1,
                has_24_7_electricity: false,
                has_generator: true,
                has_elevator: false,
                has_parking: true,
                price_usd: 3500,
                notes: 'Luxury villa with garden',
                status: 'active',
                content_status: 'new',
                terrace: true,
                pool: true,
                gym: false,
                heating_system: 'Central Heating',
                ac_system: 'Split AC'
            },
            {
                property_type: 'Office',
                purpose: 'sale',
                furnished: 'partially',
                city: 'Beirut',
                area: 'Downtown',
                ownership_type: 'Company',
                built_up_area: 200,
                land_area: 0,
                bedrooms: 0,
                bathrooms: 2,
                floor_level: 10,
                has_24_7_electricity: true,
                has_generator: true,
                has_elevator: true,
                has_parking: true,
                price_usd: 450000,
                notes: 'Modern office space in prime location',
                status: 'active',
                content_status: 'in_review',
                ac_system: 'VRV System',
                security: true
            },
            {
                property_type: 'Apartment',
                purpose: 'rent',
                furnished: 'yes',
                city: 'Mount Lebanon',
                area: 'Jounieh',
                ownership_type: 'Individual',
                built_up_area: 120,
                land_area: 0,
                bedrooms: 2,
                bathrooms: 1,
                floor_level: 2,
                has_24_7_electricity: false,
                has_generator: true,
                has_elevator: true,
                has_parking: true,
                price_usd: 1200,
                notes: 'Cozy apartment near the sea',
                status: 'active',
                content_status: 'ready',
                balcony: true,
                ac_system: 'Split AC'
            },
            {
                property_type: 'Land',
                purpose: 'sale',
                furnished: 'no',
                city: 'Mount Lebanon',
                area: 'Beit Mery',
                ownership_type: 'Individual',
                built_up_area: 0,
                land_area: 1000,
                bedrooms: 0,
                bathrooms: 0,
                floor_level: 0,
                has_24_7_electricity: true,
                has_generator: false,
                has_elevator: false,
                has_parking: false,
                price_usd: 350000,
                notes: 'Prime land with mountain view',
                status: 'active',
                content_status: 'ready',
                zoning: 'Residential'
            },
            {
                property_type: 'Apartment',
                purpose: 'both',
                furnished: 'yes',
                city: 'Beirut',
                area: 'Hamra',
                ownership_type: 'Individual',
                built_up_area: 180,
                land_area: 0,
                bedrooms: 3,
                bathrooms: 2,
                floor_level: 7,
                has_24_7_electricity: false,
                has_generator: true,
                has_elevator: true,
                has_parking: true,
                price_usd: 280000,
                notes: 'Renovated apartment in the heart of Hamra',
                status: 'on_hold',
                content_status: 'ready',
                balcony: true,
                terrace: true,
                ac_system: 'Central AC'
            },
            {
                property_type: 'Shop',
                purpose: 'rent',
                furnished: 'no',
                city: 'Beirut',
                area: 'Mar Mikhael',
                ownership_type: 'Individual',
                built_up_area: 80,
                land_area: 0,
                bedrooms: 0,
                bathrooms: 1,
                floor_level: 0,
                has_24_7_electricity: true,
                has_generator: true,
                has_elevator: false,
                has_parking: false,
                price_usd: 2500,
                notes: 'Trendy shop in Mar Mikhael',
                status: 'active',
                content_status: 'needs_fix'
            },
            {
                property_type: 'Duplex',
                purpose: 'sale',
                furnished: 'partially',
                city: 'Mount Lebanon',
                area: 'Broummana',
                ownership_type: 'Individual',
                built_up_area: 250,
                land_area: 0,
                bedrooms: 4,
                bathrooms: 3,
                floor_level: 5,
                has_24_7_electricity: false,
                has_generator: true,
                has_elevator: true,
                has_parking: true,
                price_usd: 380000,
                notes: 'Spacious duplex with amazing view',
                status: 'archived',
                content_status: 'ready',
                terrace: true,
                heating_system: 'Central Heating',
                ac_system: 'Central AC'
            }
        ];

        for (const property of sampleProperties) {
            await connection.query(
                `INSERT INTO properties (
                    agent_id, property_type, purpose, furnished, city, area, 
                    ownership_type, built_up_area, land_area, bedrooms, bathrooms, 
                    floor_level, has_24_7_electricity, has_generator, has_elevator, 
                    has_parking, price_usd, notes, status, content_status,
                    balcony, terrace, heating_system, ac_system, pool, gym, 
                    concierge, security, zoning
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    agentId,
                    property.property_type,
                    property.purpose,
                    property.furnished,
                    property.city,
                    property.area,
                    property.ownership_type,
                    property.built_up_area,
                    property.land_area,
                    property.bedrooms,
                    property.bathrooms,
                    property.floor_level,
                    property.has_24_7_electricity,
                    property.has_generator,
                    property.has_elevator,
                    property.has_parking,
                    property.price_usd,
                    property.notes,
                    property.status,
                    property.content_status,
                    property.balcony || false,
                    property.terrace || false,
                    property.heating_system || null,
                    property.ac_system || null,
                    property.pool || false,
                    property.gym || false,
                    property.concierge || false,
                    property.security || false,
                    property.zoning || null
                ]
            );
            console.log(`  ✓ Added ${property.property_type} in ${property.area}, ${property.city} ($${property.price_usd.toLocaleString()})`);
        }

        console.log('\n✅ Sample data seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`  - ${sampleClients.length} clients added`);
        console.log(`  - ${sampleProperties.length} properties added`);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run seeding
seedSampleData()
    .then(() => {
        console.log('\n🎉 All done! Refresh your dashboard to see the data.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to seed data:', error);
        process.exit(1);
    });
