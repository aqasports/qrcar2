import { Pool } from 'pg';
import { neon } from '@netlify/neon';
import fs from 'fs';
import path from 'path';

import { executeSqliteQuery } from './sqlite';

const dbUrl = process.env.NETLIFY_DB_URL || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
const isLocal = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

let neonSql: any = null;
let pgPool: Pool | null = null;

if (!isLocal) {
  neonSql = neon(dbUrl || '');
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db_store.json');

const INITIAL_STORE: {
  users: any[];
  clients: any[];
  vehicles: any[];
  pvc_cards: any[];
  actions: any[];
  action_workers: any[];
  action_parts: any[];
  parts: any[];
  invoices: any[];
  appointments: any[];
  reminders: any[];
  workers: any[];
  audit_logs: any[];
} = {
  users: [
    {
      id: 'usr_admin',
      username: 'admin',
      password_hash: '$2a$10$7vN3nI4D5zUjU1U0x8v9Le4a8.G0qTq9.B6Z8j3d4b6r4v5y6z7w.',
      role: 'super_admin',
      active: true,
    },
    {
      id: 'usr_manager',
      username: 'manager',
      password_hash: '$2a$10$7vN3nI4D5zUjU1U0x8v9Le4a8.G0qTq9.B6Z8j3d4b6r4v5y6z7w.',
      role: 'manager',
      active: true,
    },
    {
      id: 'usr_tech',
      username: 'tech',
      password_hash: '$2a$10$7vN3nI4D5zUjU1U0x8v9Le4a8.G0qTq9.B6Z8j3d4b6r4v5y6z7w.',
      role: 'technician',
      active: true,
    },
  ],
  workers: [],
  clients: [],
  vehicles: [],
  pvc_cards: [],
  parts: [],
  actions: [],
  action_workers: [],
  action_parts: [],
  invoices: [],
  appointments: [],
  reminders: [],
  audit_logs: [],
};

// Helper to get store
export function getStoreData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_STORE,
        ...parsed,
        users: INITIAL_STORE.users, // preserve admin credentials
      };
    }
  } catch (e) {
    // fallback
  }
  return { ...INITIAL_STORE };
}

// Helper to save store
export function saveStoreData(store: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save persistent store:', e);
  }
}

// In-Memory / File-Backed Query Parser with full CRUD support
function executeInMemoryQuery(queryText: string, values: any[] = []): any[] {
  const cleanQuery = queryText.replace(/\s+/g, ' ').trim().toLowerCase();
  const store = getStoreData();
  let mutated = false;
  let result: any[] = [];

  // PVC Card by Token
  if (cleanQuery.includes('from pvc_cards where token = $1')) {
    const token = values[0];
    return store.pvc_cards.filter((c: any) => c.token === token);
  }

  // PVC Cards List
  if (cleanQuery.includes('from pvc_cards')) {
    return store.pvc_cards;
  }

  // Insert PVC Card
  if (cleanQuery.includes('insert into pvc_cards')) {
    const newCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      token: values[0],
      serial_label: values[1],
      status: values[2] || 'unassigned',
      vehicle_id: values[3] || null,
      linked_at: values[3] ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    };
    store.pvc_cards.push(newCard);
    saveStoreData(store);
    return [newCard];
  }

  // Link PVC Card
  if (cleanQuery.includes('update pvc_cards set')) {
    const token = values[values.length - 1];
    const card = store.pvc_cards.find((c: any) => c.token === token);
    if (card) {
      if (cleanQuery.includes('vehicle_id = $1')) {
        card.vehicle_id = values[0];
        card.status = 'active';
        card.linked_at = new Date().toISOString();
      } else if (cleanQuery.includes('status = $1')) {
        card.status = values[0];
        card.revoked_at = new Date().toISOString();
      }
      saveStoreData(store);
      return [card];
    }
  }

  // Vehicle with Client Join
  if (cleanQuery.includes('from vehicles v') && cleanQuery.includes('join clients c') && cleanQuery.includes('where v.id = $1')) {
    const vId = values[0];
    const v = store.vehicles.find((x: any) => x.id === vId);
    if (!v) return [];
    const c = store.clients.find((x: any) => x.id === v.client_id);
    return [{ ...v, client_name: c?.full_name || 'Client', client_phone: c?.phone || '' }];
  }

  // Vehicles list
  if (cleanQuery.includes('from vehicles')) {
    if (cleanQuery.includes('where client_id = $1') || cleanQuery.includes('where v.client_id = $1')) {
      const cId = values[0];
      return store.vehicles.filter((v: any) => v.client_id === cId);
    }
    if (cleanQuery.includes('where id = $1') || cleanQuery.includes('where v.id = $1')) {
      const vId = values[0];
      return store.vehicles.filter((v: any) => v.id === vId);
    }
    if (cleanQuery.includes('where plate_number = $1') || cleanQuery.includes('where v.plate_number = $1')) {
      const plate = values[0];
      return store.vehicles.filter((v: any) => v.plate_number === plate);
    }

    return store.vehicles.map((v: any) => {
      const c = store.clients.find((x: any) => x.id === v.client_id);
      return { ...v, client_name: c?.full_name || 'Client' };
    });
  }

  // Insert Vehicle
  if (cleanQuery.includes('insert into vehicles')) {
    const [
      client_id, plate_number, make, model, year, vin, color, current_mileage,
      fuel_type, transmission, engine_spec, oil_type, tire_size
    ] = values;
    const newVehicle = {
      id: `veh_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      client_id: client_id || null,
      plate_number,
      make,
      model,
      year: parseInt(year, 10) || new Date().getFullYear(),
      vin: vin || null,
      color: color || null,
      current_mileage: parseInt(current_mileage, 10) || 0,
      fuel_type: fuel_type || 'diesel',
      transmission: transmission || 'manuelle',
      engine_spec: engine_spec || null,
      oil_type: oil_type || null,
      tire_size: tire_size || null,
      next_service_mileage: (parseInt(current_mileage, 10) || 0) + 15000,
      next_service_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      next_inspection_date: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.vehicles.push(newVehicle);
    saveStoreData(store);
    return [newVehicle];
  }

  // Update Vehicle (Transfer / Detach / Specs)
  if (cleanQuery.includes('update vehicles set')) {
    const vId = values[values.length - 1];
    const veh = store.vehicles.find((v: any) => v.id === vId);
    if (veh) {
      if (cleanQuery.includes('set client_id = null')) {
        veh.client_id = null;
      } else if (cleanQuery.includes('set client_id = $1')) {
        veh.client_id = values[0];
      }
      veh.updated_at = new Date().toISOString();
      saveStoreData(store);
      return [veh];
    }
  }

  // Actions for Vehicle
  if (cleanQuery.includes('from actions a where a.vehicle_id = $1') || cleanQuery.includes('from actions where vehicle_id = $1')) {
    const vId = values[0];
    const acts = store.actions.filter((a: any) => a.vehicle_id === vId);
    return acts.map((a: any) => {
      const inv = store.invoices.find((i: any) => i.action_id === a.id);
      return { ...a, invoice_id: inv?.id || null };
    });
  }

  // All Actions
  if (cleanQuery.includes('from actions')) {
    return store.actions.map((a: any) => {
      const v = store.vehicles.find((x: any) => x.id === a.vehicle_id);
      return { ...a, plate_number: v?.plate_number, make: v?.make, model: v?.model };
    });
  }

  // Insert Action
  if (cleanQuery.includes('insert into actions')) {
    const [vehicle_id, type, description, client_visible_notes, internal_notes, mileage_at_service, status, labor_cost, created_by] = values;
    const newAction = {
      id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      vehicle_id,
      type,
      description,
      client_visible_notes: client_visible_notes || null,
      internal_notes: internal_notes || null,
      mileage_at_service: parseInt(mileage_at_service, 10) || 0,
      status: status || 'open',
      labor_cost: parseFloat(labor_cost) || 0.00,
      created_by,
      date_in: new Date().toISOString(),
      date_out: null,
      created_at: new Date().toISOString(),
    };
    store.actions.unshift(newAction);

    // Update vehicle mileage if higher
    const veh = store.vehicles.find((v: any) => v.id === vehicle_id);
    if (veh && newAction.mileage_at_service > veh.current_mileage) {
      veh.current_mileage = newAction.mileage_at_service;
    }
    saveStoreData(store);
    return [newAction];
  }

  // Appointments for Vehicle
  if (cleanQuery.includes('from appointments where vehicle_id = $1')) {
    const vId = values[0];
    return store.appointments.filter((a: any) => a.vehicle_id === vId);
  }

  // All Appointments with Vehicle & Client
  if (cleanQuery.includes('from appointments a join vehicles v on a.vehicle_id = v.id')) {
    let list = store.appointments.map((a: any) => {
      const v = store.vehicles.find((x: any) => x.id === a.vehicle_id);
      const c = v ? store.clients.find((x: any) => x.id === v.client_id) : null;
      return {
        ...a,
        plate_number: v?.plate_number || '',
        make: v?.make || '',
        model: v?.model || '',
        year: v?.year || 2020,
        vehicle_current_mileage: v?.current_mileage || 0,
        client_id: c?.id || '',
        client_name: c?.full_name || 'Client',
        client_phone_registered: c?.phone || '',
      };
    });
    if (values[0] && values[0] !== 'all') {
      list = list.filter((x: any) => x.status === values[0]);
    }
    return list;
  }

  // Insert Appointment
  if (cleanQuery.includes('insert into appointments')) {
    const [vehicle_id, service_type, preferred_date, preferred_time_slot, current_mileage, notes, client_phone] = values;
    const newApp = {
      id: `app_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      vehicle_id,
      service_type,
      preferred_date,
      preferred_time_slot: preferred_time_slot || 'morning',
      current_mileage: current_mileage || null,
      notes: notes || null,
      client_phone: client_phone || null,
      status: 'pending',
      garage_response: null,
      created_at: new Date().toISOString(),
    };
    store.appointments.unshift(newApp);
    saveStoreData(store);
    return [newApp];
  }

  // Update Appointment Status
  if (cleanQuery.includes('update appointments set')) {
    const [status, garage_response, , , , id] = values;
    const app = store.appointments.find((a: any) => a.id === id);
    if (app) {
      if (status) app.status = status;
      if (garage_response) app.garage_response = garage_response;
      saveStoreData(store);
      return [app];
    }
  }

  // Reminders for Vehicle
  if (cleanQuery.includes('from reminders where vehicle_id = $1')) {
    const vId = values[0];
    return store.reminders.filter((r: any) => r.vehicle_id === vId);
  }

  // Single Client by ID
  if (cleanQuery.includes('from clients where id = $1') || cleanQuery.includes('from clients c where c.id = $1')) {
    const cId = values[0];
    return store.clients.filter((c: any) => c.id === cId);
  }

  // Single Client by Phone
  if (cleanQuery.includes('from clients where phone = $1')) {
    const phone = values[0];
    return store.clients.filter((c: any) => c.phone === phone);
  }

  // Update Client
  if (cleanQuery.includes('update clients set')) {
    const cId = values[values.length - 1];
    const client = store.clients.find((c: any) => c.id === cId);
    if (client) {
      const [full_name, phone, email, address, notes] = values;
      if (full_name) client.full_name = full_name;
      if (phone) client.phone = phone;
      if (email !== undefined) client.email = email;
      if (address !== undefined) client.address = address;
      if (notes !== undefined) client.notes = notes;
      client.updated_at = new Date().toISOString();
      saveStoreData(store);
      return [client];
    }
  }

  // Users by Username
  if (cleanQuery.includes('from users where username = $1')) {
    const username = values[0];
    return store.users.filter((u: any) => u.username === username);
  }

  // Clients
  if (cleanQuery.includes('from clients')) {
    return store.clients;
  }

  // Insert Client
  if (cleanQuery.includes('insert into clients')) {
    const [full_name, phone, email, address, notes] = values;
    const newClient = {
      id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      full_name,
      phone,
      email: email || null,
      address: address || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };
    store.clients.push(newClient);
    saveStoreData(store);
    return [newClient];
  }

  // Workers
  if (cleanQuery.includes('from workers')) {
    return store.workers;
  }

  // Insert Worker
  if (cleanQuery.includes('insert into workers')) {
    const [full_name, phone, role, hourly_rate] = values;
    const newWorker = {
      id: `wrk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      full_name,
      phone,
      role: role || 'Mécanicien',
      hourly_rate: parseFloat(hourly_rate) || 0.00,
      active: true,
      created_at: new Date().toISOString(),
    };
    store.workers.push(newWorker);
    saveStoreData(store);
    return [newWorker];
  }

  // Parts / Inventory
  if (cleanQuery.includes('from parts')) {
    return store.parts;
  }

  // Insert Part
  if (cleanQuery.includes('insert into parts')) {
    const [name, category, sku, unit, purchase_price, sale_price, quantity_in_stock, min_stock_threshold] = values;
    const newPart = {
      id: `prt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      category,
      sku,
      unit: unit || 'piece',
      purchase_price: parseFloat(purchase_price) || 0.00,
      sale_price: parseFloat(sale_price) || 0.00,
      quantity_in_stock: parseInt(quantity_in_stock, 10) || 0,
      min_stock_threshold: parseInt(min_stock_threshold, 10) || 5,
      active: true,
      created_at: new Date().toISOString(),
    };
    store.parts.push(newPart);
    saveStoreData(store);
    return [newPart];
  }

  // Invoices
  if (cleanQuery.includes('from invoices')) {
    return store.invoices;
  }

  // Dashboard Stats
  if (cleanQuery.includes('from invoices where status = \'paid\'')) {
    const paidSum = store.invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + (parseFloat(i.total) || 0), 0);
    return [{ paid: paidSum }];
  }

  if (cleanQuery.includes('from invoices where status = \'issued\'')) {
    const issuedSum = store.invoices.filter((i: any) => i.status === 'issued').reduce((sum: number, i: any) => sum + (parseFloat(i.total) || 0), 0);
    return [{ issued: issuedSum }];
  }

  if (cleanQuery.includes('count(distinct vehicle_id)')) {
    const activeVehicles = new Set(store.actions.filter((a: any) => a.status === 'open' || a.status === 'in_progress').map((a: any) => a.vehicle_id)).size;
    return [{ count: activeVehicles }];
  }

  // Insert Audit Log
  if (cleanQuery.includes('insert into audit_logs')) {
    const [user_id, entity_type, entity_id, action, metadata] = values;
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user_id,
      entity_type,
      entity_id,
      action,
      metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata,
      created_at: new Date().toISOString(),
    };
    store.audit_logs.unshift(newLog);
    saveStoreData(store);
    return [newLog];
  }

  // Select Audit Logs
  if (cleanQuery.includes('from audit_logs')) {
    return store.audit_logs.map((log: any) => {
      const u = store.users.find((user: any) => user.id === log.user_id);
      return {
        ...log,
        user_name: u?.username || 'Super Admin',
      };
    });
  }

  return [];
}

// Unified client overload declarations
export async function sql<T = any>(queryText: string, values?: any[]): Promise<T[]>;
export async function sql<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]>;
export async function sql<T = any>(stringsOrQuery: any, ...values: any[]): Promise<T[]> {
  const url = process.env.NETLIFY_DB_URL || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  const isLocalConn = !url || url.includes('localhost') || url.includes('127.0.0.1');

  let rawQuery = '';
  let rawValues: any[] = [];

  if (typeof stringsOrQuery === 'string') {
    rawQuery = stringsOrQuery;
    rawValues = values[0] || [];
  } else {
    const strings = stringsOrQuery as string[];
    for (let i = 0; i < strings.length; i++) {
      rawQuery += strings[i];
      if (i < values.length) {
        rawQuery += `$${i + 1}`;
      }
    }
    rawValues = values;
  }

  if (!isLocalConn) {
    if (!neonSql) {
      neonSql = neon(url || '');
    }
    return neonSql(rawQuery, rawValues);
  } else {
    try {
      if (!pgPool) {
        pgPool = new Pool({ connectionString: url, connectionTimeoutMillis: 1000 });
      }
      const res = await pgPool.query(rawQuery, rawValues);
      return res.rows;
    } catch (e: any) {
      try {
        return (await executeSqliteQuery(rawQuery, rawValues)) as unknown as T[];
      } catch (sqliteErr: any) {
        return executeInMemoryQuery(rawQuery, rawValues) as T[];
      }
    }
  }
}

export async function closePg() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}
