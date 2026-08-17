import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/dashboard - High-level workshop metrics and KPIs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 1. Revenue metrics (paid and issued totals)
    const revPaidRows = await sql(`SELECT COALESCE(SUM(total), 0) as paid FROM invoices WHERE status = 'paid'`);
    const revIssuedRows = await sql(`SELECT COALESCE(SUM(total), 0) as issued FROM invoices WHERE status = 'issued'`);
    
    const paid = parseFloat(revPaidRows?.[0]?.paid || '0') || 0;
    const issued = parseFloat(revIssuedRows?.[0]?.issued || '0') || 0;

    const revenue = {
      paid,
      issued,
      total: paid + issued,
    };

    // 2. Active shop vehicles count (vehicles with open/in_progress actions)
    const activeVehiclesRows = await sql(`
      SELECT COUNT(DISTINCT vehicle_id) as count 
      FROM actions 
      WHERE status IN ('open', 'in_progress')
    `);
    const activeVehicles = parseInt(activeVehiclesRows?.[0]?.count || '0', 10) || 0;

    // 3. Worker leaderboard
    const leaderboardRows = await sql(`
      SELECT w.id, w.full_name, w.role, COUNT(aw.action_id) as job_count
      FROM workers w
      LEFT JOIN action_workers aw ON w.id = aw.worker_id AND aw.role_on_job = 'lead'
      WHERE w.active = true
      GROUP BY w.id, w.full_name, w.role
      ORDER BY job_count DESC
      LIMIT 5
    `);
    const leaderboard = Array.isArray(leaderboardRows) ? leaderboardRows : [];

    // 4. Low stock parts count
    const lowStockRows = await sql(`
      SELECT COUNT(*) as count 
      FROM parts 
      WHERE active = true AND quantity_in_stock <= min_stock_threshold
    `);
    const lowStockCount = parseInt(lowStockRows?.[0]?.count || '0', 10) || 0;

    // 5. Total clients count
    const clientCountRows = await sql(`SELECT COUNT(*) as count FROM clients`);
    const totalClients = parseInt(clientCountRows?.[0]?.count || '0', 10) || 0;

    // 6. Recent service actions
    const recentJobsRows = await sql(`
      SELECT a.id, a.type, a.status, a.date_in, v.plate_number, v.make, v.model
      FROM actions a
      JOIN vehicles v ON a.vehicle_id = v.id
      ORDER BY a.date_in DESC
      LIMIT 5
    `);
    const recentJobs = Array.isArray(recentJobsRows) ? recentJobsRows : [];

    return NextResponse.json({
      revenue,
      activeVehicles,
      leaderboard,
      lowStockCount,
      totalClients,
      recentJobs
    });
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
    return NextResponse.json({
      revenue: { paid: 0, issued: 0, total: 0 },
      activeVehicles: 0,
      leaderboard: [],
      lowStockCount: 0,
      totalClients: 0,
      recentJobs: []
    });
  }
}
