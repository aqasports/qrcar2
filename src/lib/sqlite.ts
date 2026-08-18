import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'local.sqlite');

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!SQL) {
    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    if (fs.existsSync(wasmPath)) {
      const buffer = fs.readFileSync(wasmPath);
      const wasmBinary = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      SQL = await initSqlJs({ wasmBinary });
    } else {
      SQL = await initSqlJs();
    }
  }
  return SQL;
}

export function saveDatabase() {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const binaryArray = dbInstance.export();
    fs.writeFileSync(DB_FILE, Buffer.from(binaryArray));
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const sqlLib = await getSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new sqlLib.Database(fileBuffer);
    } catch (e) {
      dbInstance = new sqlLib.Database();
      initSchema(dbInstance);
      saveDatabase();
    }
  } else {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbInstance = new sqlLib.Database();
    initSchema(dbInstance);
    saveDatabase();
  }

  return dbInstance;
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tier TEXT NOT NULL,
      price_monthly REAL DEFAULT 0.00,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      plan_id TEXT,
      subscription_status TEXT DEFAULT 'active',
      logo_url TEXT,
      brand_color_primary TEXT DEFAULT '#0f172a',
      brand_color_secondary TEXT DEFAULT '#f59e0b',
      locale TEXT DEFAULT 'fr',
      currency TEXT DEFAULT 'DZD',
      wilaya TEXT DEFAULT '16 - Alger',
      city TEXT DEFAULT 'Alger',
      address TEXT,
      phone TEXT,
      email TEXT,
      is_verified_pro INTEGER DEFAULT 1,
      is_directory_listed INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      is_main INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'manager',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      full_name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      name TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      client_id TEXT,
      plate_number TEXT UNIQUE NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      vin TEXT,
      color TEXT,
      current_mileage INTEGER NOT NULL DEFAULT 0,
      fuel_type TEXT DEFAULT 'diesel',
      transmission TEXT DEFAULT 'manuelle',
      engine_spec TEXT,
      oil_type TEXT DEFAULT '5W-30',
      tire_size TEXT,
      next_service_mileage INTEGER,
      next_service_date TEXT,
      next_inspection_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pvc_cards (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      token TEXT UNIQUE NOT NULL,
      serial_label TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'active', 'revoked', 'lost')),
      vehicle_id TEXT,
      linked_at TEXT,
      revoked_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      user_id TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'Mécanicien',
      hourly_rate REAL NOT NULL DEFAULT 0.00,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parts (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      supplier_id TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE,
      unit TEXT NOT NULL DEFAULT 'piece',
      purchase_price REAL NOT NULL DEFAULT 0.00,
      sale_price REAL NOT NULL DEFAULT 0.00,
      quantity_in_stock INTEGER NOT NULL DEFAULT 0,
      min_stock_threshold INTEGER NOT NULL DEFAULT 5,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      vehicle_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      client_visible_notes TEXT,
      internal_notes TEXT,
      mileage_at_service INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'invoiced')),
      labor_cost REAL NOT NULL DEFAULT 0.00,
      created_by TEXT,
      date_in TEXT DEFAULT CURRENT_TIMESTAMP,
      date_out TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS action_workers (
      id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      hours_spent REAL NOT NULL DEFAULT 0.0,
      role_on_job TEXT NOT NULL DEFAULT 'lead'
    );

    CREATE TABLE IF NOT EXISTS action_parts (
      id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      part_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_snapshot REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      part_id TEXT NOT NULL,
      action_id TEXT,
      type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment')),
      quantity INTEGER NOT NULL,
      reason TEXT,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      action_id TEXT NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      subtotal REAL NOT NULL,
      tax_rate REAL NOT NULL DEFAULT 0.00,
      tax_amount REAL NOT NULL DEFAULT 0.00,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
      issued_at TEXT,
      paid_at TEXT,
      pdf_blob_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      vehicle_id TEXT NOT NULL,
      service_type TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time_slot TEXT NOT NULL DEFAULT 'morning',
      current_mileage INTEGER,
      notes TEXT,
      client_phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
      garage_response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      vehicle_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('oil_change', 'inspection', 'timing_belt', 'brakes', 'tires', 'custom')),
      title TEXT NOT NULL,
      due_date TEXT,
      due_mileage INTEGER,
      notification_channel TEXT DEFAULT 'calendar',
      contact_target TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      organization_id TEXT,
      user_id TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Seed default organization & users
    INSERT OR IGNORE INTO plans (id, name, slug, tier, price_monthly, active)
    VALUES ('plan_pro', 'Pro Garage', 'pro', 'pro', 4900.00, 1);

    INSERT OR IGNORE INTO organizations (id, name, slug, plan_id, subscription_status, brand_color_primary, locale, city)
    VALUES ('org_main', 'Garage Pro Alger', 'garage-pro-alger', 'plan_pro', 'active', '#0f172a', 'fr', 'Alger');

    INSERT OR IGNORE INTO users (id, organization_id, username, password_hash, role, active)
    VALUES 
      ('usr_admin', 'org_main', 'admin', '$2a$10$7vN3nI4D5zUjU1U0x8v9Le4a8.G0qTq9.B6Z8j3d4b6r4v5y6z7w.', 'super_admin', 1),
      ('usr_manager', 'org_main', 'manager', '$2a$10$7vN3nI4D5zUjU1U0x8v9Le4a8.G0qTq9.B6Z8j3d4b6r4v5y6z7w.', 'manager', 1),
      ('usr_tech', 'org_main', 'tech', '$2a$10$7vN3nI4D5zUjU1U0x8v9Le4a8.G0qTq9.B6Z8j3d4b6r4v5y6z7w.', 'technician', 1);
  `);
}

function getTableName(query: string): string {
  const match = query.match(/(?:INSERT\s+INTO|UPDATE|FROM)\s+([a-zA-Z0-9_]+)/i);
  return match ? match[1] : '';
}

// Convert Postgres-style SQL to SQLite-compatible SQL and execute
export async function executeSqliteQuery(queryText: string, values: any[] = []): Promise<any[]> {
  const db = await getSqliteDb();

  // Normalize query
  let sql = queryText
    .replace(/\bILIKE\b/gi, 'LIKE')
    .replace(/RETURNING\s+\*/gi, '')
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
    .replace(/COALESCE\s*\(\s*SUM\s*\(\s*total\s*\)\s*,\s*0\s*\)/gi, "TOTAL(total)")
    .replace(/COUNT\s*\(\s*DISTINCT\s+vehicle_id\s*\)/gi, "COUNT(DISTINCT vehicle_id)");

  const isInsert = /^\s*INSERT\s+INTO/i.test(queryText);
  const isUpdate = /^\s*UPDATE\b/i.test(queryText);
  const isSelect = /^\s*SELECT\b/i.test(queryText);

  // Convert $1, $2, $3 to ?
  const sqliteParams: any[] = [];
  sql = sql.replace(/\$(\d+)/g, (match, index) => {
    const paramIdx = parseInt(index, 10) - 1;
    sqliteParams.push(values[paramIdx]);
    return '?';
  });

  const paramsToUse = sqliteParams.length > 0 ? [...sqliteParams] : [...values];

  let generatedId: string | null = null;
  // Auto-assign primary key ID for inserts if not provided
  if (isInsert) {
    const tableName = getTableName(queryText);
    if (!sql.toLowerCase().includes('(id,') && !sql.toLowerCase().includes('( id,')) {
      generatedId = crypto.randomUUID ? crypto.randomUUID() : `${tableName.slice(0, 3)}_${Date.now()}`;
      sql = sql.replace(new RegExp(`INSERT\\s+INTO\\s+${tableName}\\s*\\(`, 'i'), `INSERT INTO ${tableName} (id, `);
      sql = sql.replace(/VALUES\s*\(/i, 'VALUES (?, ');
      paramsToUse.unshift(generatedId);
    }
  }

  try {
    if (isSelect) {
      const stmt = db.prepare(sql);
      if (paramsToUse && paramsToUse.length > 0) {
        stmt.bind(paramsToUse);
      }
      const results: any[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } else {
      // INSERT / UPDATE / DELETE
      db.run(sql, paramsToUse);
      saveDatabase();

      if (queryText.toUpperCase().includes('RETURNING *')) {
        const table = getTableName(queryText);
        if (isInsert) {
          if (generatedId) {
            const res = db.exec(`SELECT * FROM ${table} WHERE id = '${generatedId}'`);
            if (res.length > 0 && res[0].values.length > 0) {
              const columns = res[0].columns;
              const rowValues = res[0].values[0];
              const obj: any = {};
              columns.forEach((col, i) => { obj[col] = rowValues[i]; });
              return [obj];
            }
          }
          const res = db.exec(`SELECT * FROM ${table} WHERE rowid = last_insert_rowid()`);
          if (res.length > 0 && res[0].values.length > 0) {
            const columns = res[0].columns;
            const rowValues = res[0].values[0];
            const obj: any = {};
            columns.forEach((col, i) => { obj[col] = rowValues[i]; });
            return [obj];
          }
        } else if (isUpdate) {
          const lastVal = paramsToUse[paramsToUse.length - 1];
          const res = db.exec(`SELECT * FROM ${table} WHERE id = ?`, [lastVal]);
          if (res.length > 0 && res[0].values.length > 0) {
            const columns = res[0].columns;
            const rowValues = res[0].values[0];
            const obj: any = {};
            columns.forEach((col, i) => { obj[col] = rowValues[i]; });
            return [obj];
          }
        }
      }

      return [];
    }
  } catch (err: any) {
    console.error('SQLite execution error:', err.message, 'SQL:', sql, 'Params:', paramsToUse);
    throw err;
  }
}
