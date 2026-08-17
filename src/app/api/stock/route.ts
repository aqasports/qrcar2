import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/stock - Fetch stock movements ledger logs
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
    const movements = await sql(`
      SELECT sm.*, p.name as part_name, p.sku as part_sku, u.username as user_name
      FROM stock_movements sm
      JOIN parts p ON sm.part_id = p.id
      JOIN users u ON sm.created_by = u.id
      ORDER BY sm.created_at DESC
      LIMIT 100
    `);
    return NextResponse.json(movements);
  } catch (error) {
    console.error('Failed to get stock movements:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
