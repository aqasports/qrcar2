import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/dashboard - High-level mega-SaaS workshop telemetry and KPIs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, organizationId } = session.user;
  if (role === 'technician') {
    // Return technician-scoped light dashboard
    return NextResponse.json({
      role: 'technician',
      activeVehicles: 0,
      recentJobs: [],
    });
  }

  try {
    // 1. Revenue metrics (paid and issued totals)
    const revPaidRows = await sql(
      `SELECT COALESCE(SUM(total), 0) as paid FROM invoices WHERE status = 'paid' AND organization_id = $1`,
      [organizationId]
    );
    const revIssuedRows = await sql(
      `SELECT COALESCE(SUM(total), 0) as issued FROM invoices WHERE status = 'issued' AND organization_id = $1`,
      [organizationId]
    );

    const paid = parseFloat(revPaidRows?.[0]?.paid || '0') || 0;
    const issued = parseFloat(revIssuedRows?.[0]?.issued || '0') || 0;

    const revenue = {
      paid,
      issued,
      total: paid + issued,
    };

    // 2. Active shop vehicles & Pipeline breakdown
    const pipelineRows = await sql(
      `
      SELECT 
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'invoiced' THEN 1 END) as invoiced_count
      FROM actions 
      WHERE organization_id = $1
    `,
      [organizationId]
    );
    const p = pipelineRows[0] || {};
    const pipeline = {
      reception: parseInt(p.open_count || '0', 10),
      inProgress: parseInt(p.in_progress_count || '0', 10),
      qualityCheck: parseInt(p.completed_count || '0', 10),
      readyToDeliver: parseInt(p.invoiced_count || '0', 10),
    };

    const activeVehicles = pipeline.reception + pipeline.inProgress;

    // 3. Worker leaderboard
    const leaderboardRows = await sql(
      `
      SELECT w.id, w.full_name, w.role, COUNT(aw.action_id) as job_count
      FROM workers w
      LEFT JOIN action_workers aw ON w.id = aw.worker_id AND aw.role_on_job = 'lead'
      WHERE w.active = true AND w.organization_id = $1
      GROUP BY w.id, w.full_name, w.role
      ORDER BY job_count DESC
      LIMIT 5
    `,
      [organizationId]
    );
    const leaderboard = Array.isArray(leaderboardRows) ? leaderboardRows : [];

    // 4. Low stock parts count & Total Parts
    const stockRows = await sql(
      `
      SELECT 
        COUNT(*) as total_parts,
        COUNT(CASE WHEN quantity_in_stock <= min_stock_threshold THEN 1 END) as low_stock_count
      FROM parts 
      WHERE active = true AND organization_id = $1
    `,
      [organizationId]
    );
    const lowStockCount = parseInt(stockRows?.[0]?.low_stock_count || '0', 10) || 0;
    const totalParts = parseInt(stockRows?.[0]?.total_parts || '0', 10) || 0;

    // 5. Total clients count & Total Vehicles
    const clientCountRows = await sql(
      `SELECT COUNT(*) as count FROM clients WHERE organization_id = $1`,
      [organizationId]
    );
    const totalClients = parseInt(clientCountRows?.[0]?.count || '0', 10) || 0;

    const vehicleCountRows = await sql(
      `SELECT COUNT(*) as count FROM vehicles WHERE organization_id = $1`,
      [organizationId]
    );
    const totalVehicles = parseInt(vehicleCountRows?.[0]?.count || '0', 10) || 0;

    // 6. Connected PVC Cards metrics
    const cardsRows = await sql(
      `
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as active_cards,
        COUNT(CASE WHEN status = 'unassigned' THEN 1 END) as available_stock
      FROM pvc_cards 
      WHERE organization_id = $1
    `,
      [organizationId]
    );
    const c = cardsRows[0] || {};
    const cardsData = {
      total: parseInt(c.total_cards || '0', 10),
      active: parseInt(c.active_cards || '0', 10),
      available: parseInt(c.available_stock || '0', 10),
    };

    // 7. B2B Ecosystem metrics (Marketplace + Solutions + Messages)
    const marketplaceRows = await sql(
      `SELECT COUNT(*) as count FROM marketplace_listings WHERE organization_id = $1 AND status = 'active'`,
      [organizationId]
    );
    const myMarketplaceListings = parseInt(marketplaceRows[0]?.count || '0', 10);

    const solutionsRows = await sql(
      `SELECT COUNT(*) as count FROM mechanical_solutions WHERE organization_id = $1`,
      [organizationId]
    );
    const myAuthoredSolutions = parseInt(solutionsRows[0]?.count || '0', 10);

    // 8. Recent service actions
    const recentJobsRows = await sql(
      `
      SELECT a.id, a.type, a.status, a.date_in, v.plate_number, v.make, v.model
      FROM actions a
      JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $1
      WHERE a.organization_id = $1
      ORDER BY a.date_in DESC
      LIMIT 6
    `,
      [organizationId]
    );
    const recentJobs = Array.isArray(recentJobsRows) ? recentJobsRows : [];

    return NextResponse.json({
      revenue,
      activeVehicles,
      pipeline,
      leaderboard,
      lowStockCount,
      totalParts,
      totalClients,
      totalVehicles,
      cardsData,
      myMarketplaceListings,
      myAuthoredSolutions,
      recentJobs,
    });
  } catch (error: any) {
    console.error('Failed to get dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
