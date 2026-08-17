// scripts/seed.js - Clean Production Administrator Seeding
require('dotenv').config();
const { neon } = require('@netlify/neon');
const bcrypt = require('bcryptjs');

const dbUrl = process.env.NETLIFY_DB_URL || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: DATABASE_URL is not configured.');
  process.exit(1);
}

const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
let sql;
let pgClient;

if (!isLocal) {
  const { neon } = require('@netlify/neon');
  sql = neon(dbUrl);
} else {
  const { Client } = require('pg');
  pgClient = new Client({ connectionString: dbUrl });
  sql = async (queryText, values) => {
    if (!pgClient._connected) {
      await pgClient.connect();
      pgClient._connected = true;
    }
    const res = await pgClient.query(queryText, values || []);
    return res.rows;
  };
}

async function seed() {
  console.log('Initializing system administrator roles...');

  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const managerHash = await bcrypt.hash('manager123', 10);
    const techHash = await bcrypt.hash('tech123', 10);

    // Seed default system users
    await sql(`
      INSERT INTO users (username, password_hash, role, active)
      VALUES 
        ('admin', $1, 'super_admin', true),
        ('manager', $2, 'manager', true),
        ('tech', $3, 'technician', true)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [adminHash, managerHash, techHash]);

    console.log('System roles initialized successfully (no fake/mock data created).');
    
    if (pgClient) await pgClient.end();
  } catch (error) {
    console.error('Initialization failed:', error);
    if (pgClient) await pgClient.end();
    process.exit(1);
  }
}

seed();
