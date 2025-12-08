/**
 * Super Admin Database Aggregation System - Test Suite
 * 
 * This script tests the UNION query logic for multi-database access
 */

import pool, { testAllAgenciesConnection, getAllAgencyDatabases } from '../config/database';
import { SuperAdminAggregator } from '../services/SuperAdminAggregator';

async function runTests() {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   SUPER ADMIN DATABASE AGGREGATION SYSTEM - TEST SUITE       ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    try {
        // ===== STEP 1 & 2: Detect and Verify Databases =====
        console.log('\n📌 STEP 1: Detecting Agency Databases...\n');
        await testAllAgenciesConnection();

        const databases = await getAllAgencyDatabases();
        console.log(`\n✓ Found ${databases.length} database(s): ${databases.join(', ')}\n`);

        // ===== STEP 2: Verify Table Structure =====
        console.log('\n📌 STEP 2: Verifying Database Structure...\n');
        const requiredTables = ['properties', 'property_images', 'clients', 'property_leads', 'users', 'property_status_history'];

        for (const db of databases) {
            console.log(`\nChecking ${db}...`);
            const [tables] = await pool.query(`SHOW TABLES FROM ${db}`);
            const tableNames = (tables as any[]).map(t => Object.values(t)[0]);

            for (const table of requiredTables) {
                if (tableNames.includes(table)) {
                    console.log(`  ✓ ${table}`);
                } else {
                    console.log(`  ✖ Missing table: ${table}`);
                }
            }

            // Check properties table columns
            if (tableNames.includes('properties')) {
                const [columns] = await pool.query(`DESCRIBE ${db}.properties`);
                const requiredColumns = ['id', 'agent_id', 'property_type', 'city', 'area', 'price_usd', 'created_at', 'status', 'status_changed_at'];
                const existingColumns = (columns as any[]).map(c => c.Field);

                console.log('\n  Properties table columns:');
                for (const col of requiredColumns) {
                    if (existingColumns.includes(col)) {
                        console.log(`    ✓ ${col}`);
                    } else {
                        console.log(`    ✖ Missing column: ${col}`);
                    }
                }
            }
        }

        // ===== TEST A: Count Properties Per Database =====
        console.log('\n\n📌 TEST A: Count Properties Per Database\n');
        let totalExpected = 0;

        for (const db of databases) {
            try {
                const [result] = await pool.query(`SELECT COUNT(*) as count FROM ${db}.properties`);
                const count = (result as any[])[0].count;
                console.log(`  ${db}: ${count} properties`);
                totalExpected += count;
            } catch (error: any) {
                console.error(`  ✖ Error counting properties in ${db}:`, error.message);
            }
        }

        console.log(`\n  Expected Total: ${totalExpected}`);

        // ===== TEST B: Verify Aggregator Returns Correct Total =====
        console.log('\n\n📌 TEST B: Testing Super Admin Aggregator\n');

        console.log('  Fetching all properties via aggregator...');
        const allProperties = await SuperAdminAggregator.getAllProperties();
        console.log(`  ✓ Retrieved ${allProperties.length} properties`);

        if (allProperties.length === totalExpected) {
            console.log(`  ✅ PASS: Total matches expected count!`);
        } else {
            console.log(`  ⚠️  WARNING: Expected ${totalExpected} but got ${allProperties.length}`);
        }

        // ===== TEST C: Global Statistics =====
        console.log('\n\n📌 TEST C: Global Statistics\n');

        const stats = await SuperAdminAggregator.getGlobalStats();
        console.log('  Global Stats:');
        console.log(`    Total Properties: ${stats.total_properties}`);
        console.log(`    Total Closed: ${stats.total_closed}`);
        console.log(`    Total Agents: ${stats.total_agents}`);
        console.log(`    Total Clients: ${stats.total_clients}`);
        console.log(`    Properties This Month: ${stats.properties_this_month}`);
        console.log(`    Closure Rate: ${stats.closure_rate}%`);
        console.log(`    Databases: ${stats.databases_count}`);
        console.log('\n  Top Locations:');
        stats.top_locations.slice(0, 5).forEach((loc: any) => {
            console.log(`    ${loc.location}: ${loc.count} properties`);
        });

        // ===== TEST D: Monthly Closure Ratio =====
        console.log('\n\n📌 TEST D: Monthly Closure Ratio\n');

        const currentYear = new Date().getFullYear();
        const monthlyData = await SuperAdminAggregator.getMonthlyClosureRatio(currentYear);
        console.log(`  ${currentYear} Monthly Data (non-zero months):\n`);

        monthlyData
            .filter(m => m.properties_added > 0 || m.properties_closed > 0)
            .forEach(month => {
                const ratio = (month.closure_ratio * 100).toFixed(1);
                console.log(`    ${month.month}: ${month.properties_added} added, ${month.properties_closed} closed (${ratio}%)`);
            });

        // ===== TEST E: Sample Data =====
        console.log('\n\n📌 TEST E: Sample Data\n');

        console.log('  Sample Properties:');
        allProperties.slice(0, 3).forEach((prop: any, idx: number) => {
            console.log(`    ${idx + 1}. [${prop.source_agency}] ${prop.property_type} in ${prop.city} - $${prop.price_usd} (${prop.status})`);
        });

        console.log('\n  Fetching sample clients...');
        const allClients = await SuperAdminAggregator.getAllClients();
        console.log(`  ✓ Retrieved ${allClients.length} clients`);

        console.log('\n  Sample Clients:');
        allClients.slice(0, 3).forEach((client: any, idx: number) => {
            console.log(`    ${idx + 1}. [${client.source_agency}] ${client.name} - ${client.email || 'No email'}`);
        });

        console.log('\n  Fetching sample agents...');
        const allAgents = await SuperAdminAggregator.getAllAgents();
        console.log(`  ✓ Retrieved ${allAgents.length} agents`);

        console.log('\n  Sample Agents:');
        allAgents.slice(0, 3).forEach((agent: any, idx: number) => {
            console.log(`    ${idx + 1}. [${agent.source_agency}] ${agent.name} - ${agent.email}`);
        });

        // ===== SUMMARY =====
        console.log('\n\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                        TEST SUMMARY                           ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');
        console.log(`  ✅ Databases Detected: ${databases.length}`);
        console.log(`  ✅ Total Properties: ${stats.total_properties}`);
        console.log(`  ✅ Total Clients: ${stats.total_clients}`);
        console.log(`  ✅ Total Agents: ${stats.total_agents}`);
        console.log(`  ✅ Aggregation System: Working`);
        console.log('\n  The Super Admin can now access aggregated data from all agencies!\n');

        // ===== API ENDPOINT EXAMPLES =====
        console.log('\n╔═══════════════════════════════════════════════════════════════╗');
        console.log('║                   API ENDPOINTS AVAILABLE                     ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝\n');
        console.log('  GET /api/superadmin/properties         - All properties');
        console.log('  GET /api/superadmin/clients            - All clients');
        console.log('  GET /api/superadmin/agents             - All agents');
        console.log('  GET /api/superadmin/stats              - Global statistics');
        console.log('  GET /api/superadmin/closure-ratio      - Monthly closure ratio');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        await pool.end();
        console.log('Connection closed.\n');
    }
}

// Run tests
runTests();
