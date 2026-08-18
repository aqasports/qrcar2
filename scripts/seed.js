// scripts/seed.js - Clean Production Administrator & Default Garage Seeding
require('dotenv').config();
const bcrypt = require('bcryptjs');

const dbUrl =
  process.env.NETLIFY_DB_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Error: DATABASE_URL is not configured.');
  process.exit(1);
}

const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
let sql;
let pgClient;

if (!isLocal) {
  const { neon } = require('@neondatabase/serverless');
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
  console.log('Initializing system administrator roles and Default Garage...');

  try {
    const adminHash = await bcrypt.hash('admin123', 10);
    const managerHash = await bcrypt.hash('manager123', 10);
    const techHash = await bcrypt.hash('tech123', 10);
    const platformAdminHash = await bcrypt.hash('platform123', 10);

    // 1. Seed plans
    await sql(`
      INSERT INTO plans (id, name, slug, tier, max_branches, max_seats, card_studio_tier, marketplace_listings_per_month, directory_tier, price_monthly)
      VALUES 
        ('10000000-0000-0000-0000-000000000001', 'Starter', 'starter', 'starter', 1, 3, 'template', 0, 'listed', 49.00),
        ('10000000-0000-0000-0000-000000000002', 'Pro', 'pro', 'pro', 3, 15, 'full', 20, 'featured', 129.00),
        ('10000000-0000-0000-0000-000000000003', 'Enterprise', 'enterprise', 'enterprise', 999999, 999999, 'full_whitelabel', 999999, 'spotlight', 299.00)
      ON CONFLICT (slug) DO NOTHING;
    `);

    // 2. Seed Default Organization
    await sql(`
      INSERT INTO organizations (id, name, slug, plan_id, subscription_status, brand_color_primary, brand_color_secondary, locale, currency)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Default Garage',
        'default-garage',
        '10000000-0000-0000-0000-000000000002',
        'active',
        '#0f172a',
        '#f59e0b',
        'fr',
        'DZD'
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Seed default system users
    const userAdmin = await sql(
      `
      INSERT INTO users (username, password_hash, active, is_platform_admin)
      VALUES ('admin', $1, true, false)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `,
      [adminHash]
    );

    const userManager = await sql(
      `
      INSERT INTO users (username, password_hash, active, is_platform_admin)
      VALUES ('manager', $1, true, false)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `,
      [managerHash]
    );

    const userTech = await sql(
      `
      INSERT INTO users (username, password_hash, active, is_platform_admin)
      VALUES ('tech', $1, true, false)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id;
    `,
      [techHash]
    );

    const userPlatform = await sql(
      `
      INSERT INTO users (username, password_hash, active, is_platform_admin)
      VALUES ('platform_admin', $1, true, true)
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_platform_admin = true
      RETURNING id;
    `,
      [platformAdminHash]
    );

    // 4. Map users to organization_members
    const defaultOrgId = '00000000-0000-0000-0000-000000000001';

    if (userAdmin[0]?.id) {
      await sql(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'owner')
         ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner'`,
        [defaultOrgId, userAdmin[0].id]
      );
    }

    if (userManager[0]?.id) {
      await sql(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'manager')
         ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'manager'`,
        [defaultOrgId, userManager[0].id]
      );
    }

    if (userTech[0]?.id) {
      await sql(
        `INSERT INTO organization_members (organization_id, user_id, role)
         VALUES ($1, $2, 'technician')
         ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'technician'`,
        [defaultOrgId, userTech[0].id]
      );
    }

    console.log('System roles and organization members initialized successfully.');

    if (pgClient) await pgClient.end();
  } catch (error) {
    console.error('Initialization failed:', error);
    if (pgClient) await pgClient.end();
    process.exit(1);
  }
}

seed();
