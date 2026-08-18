import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import { executeSqliteQuery } from './sqlite';

// Connection String Resolution
const dbUrl =
  process.env.NETLIFY_DB_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';

const isNeon =
  dbUrl.includes('neon.tech') ||
  process.env.NETLIFY_DB_URL !== undefined ||
  process.env.NETLIFY_DATABASE_URL !== undefined;

let pgPool: Pool | null = null;
let neonClient: any = null;

export function getPgPool(): Pool {
  if (!dbUrl) {
    throw new Error(
      'Database connection URL is not configured. Please set NETLIFY_DB_URL or DATABASE_URL in your environment.'
    );
  }
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: dbUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pgPool;
}

// Initialized Drizzle instance
export const db = isNeon && !dbUrl.includes('localhost')
  ? drizzleNeon({ client: neon(dbUrl), schema })
  : (dbUrl ? drizzle(getPgPool(), { schema }) : null as any);

/**
 * Execute tenant-scoped database operations.
 * Sets PostgreSQL RLS session variable `app.current_org_id` within a transaction.
 */
export async function withOrgScope<T>(
  orgId: string,
  fn: (scopedDb: typeof db) => Promise<T>
): Promise<T> {
  if (!orgId) {
    throw new Error('Tenant organization_id is required for withOrgScope.');
  }

  try {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL app.current_org_id = $1', [orgId]);
      await client.query('SET LOCAL app.is_platform_admin = $1', ['false']);

      const scopedDrizzle = drizzle(client, { schema });
      const result = await fn(scopedDrizzle as any);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    // If PG is unavailable in local dev, run with fallback db instance
    if (db) {
      return await fn(db);
    }
    throw error;
  }
}

/**
 * Execute platform admin operations across tenants.
 * Sets PostgreSQL RLS session variable `app.is_platform_admin = 'true'`.
 */
export async function withPlatformAdminScope<T>(
  fn: (adminDb: typeof db) => Promise<T>
): Promise<T> {
  try {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL app.is_platform_admin = $1', ['true']);

      const adminDrizzle = drizzle(client, { schema });
      const result = await fn(adminDrizzle as any);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (db) {
      return await fn(db);
    }
    throw error;
  }
}

/**
 * Direct Parameterized SQL query helper for migrations and custom raw queries.
 * Connects to PostgreSQL/Neon, and falls back to SQLite for local development.
 */
export async function sql<T = any>(
  queryTextOrStrings: string | TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  let rawQuery = '';
  let rawValues: any[] = [];

  if (typeof queryTextOrStrings === 'string') {
    rawQuery = queryTextOrStrings;
    rawValues = values[0] || [];
  } else {
    const strings = queryTextOrStrings as unknown as string[];
    for (let i = 0; i < strings.length; i++) {
      rawQuery += strings[i];
      if (i < values.length) {
        rawQuery += `$${i + 1}`;
      }
    }
    rawValues = values;
  }

  if (isNeon && !dbUrl.includes('localhost')) {
    try {
      if (!neonClient) {
        neonClient = neon(dbUrl);
      }
      return (await neonClient(rawQuery, rawValues)) as unknown as T[];
    } catch (neonErr) {
      console.warn('Neon connection failed, falling back to local SQLite:', neonErr);
      return (await executeSqliteQuery(rawQuery, rawValues)) as unknown as T[];
    }
  } else if (dbUrl && !dbUrl.includes('56339')) {
    try {
      const pool = getPgPool();
      const result = await pool.query(rawQuery, rawValues);
      return result.rows as T[];
    } catch (pgError) {
      return (await executeSqliteQuery(rawQuery, rawValues)) as unknown as T[];
    }
  } else {
    // Local SQLite development mode
    return (await executeSqliteQuery(rawQuery, rawValues)) as unknown as T[];
  }
}

export async function closePg() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}

export * from '@/db/schema';
