// scripts/migrate.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { neon } = require('@netlify/neon');

const dbUrl = process.env.NETLIFY_DB_URL || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: NETLIFY_DB_URL, NETLIFY_DATABASE_URL or DATABASE_URL environment variable is not set.');
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

async function runMigrations() {
  console.log('Starting database migrations...');

  try {
    // 1. Create schema_migrations table if it doesn't exist
    await sql(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Read migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    // 3. Get applied migrations
    const appliedRows = await sql('SELECT name FROM schema_migrations');
    const appliedSet = new Set(appliedRows.map(row => row.name));

    // 4. Apply unapplied migrations
    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`Migration ${file} is already applied.`);
        continue;
      }

      console.log(`Applying migration ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // Execute migration
      await sql(sqlContent);

      // Record migration
      await sql('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      console.log(`Migration ${file} applied successfully.`);
    }

    console.log('All migrations applied successfully.');
    if (pgClient) await pgClient.end();
  } catch (error) {
    console.error('Migration failed:', error);
    if (pgClient) await pgClient.end();
    process.exit(1);
  }
}

runMigrations();
