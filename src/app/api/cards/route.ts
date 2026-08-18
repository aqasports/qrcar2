import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/cards - List cards scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, organizationId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';

  try {
    let query = `
      SELECT c.*, v.plate_number, v.make, v.model, cl.full_name as client_name
      FROM pvc_cards c
      LEFT JOIN vehicles v ON c.vehicle_id = v.id
      LEFT JOIN clients cl ON v.client_id = cl.id
      WHERE c.organization_id = $1
    `;
    const params: any[] = [organizationId];
    if (status) {
      query += ` AND c.status = $2`;
      params.push(status);
    }
    query += ` ORDER BY c.created_at DESC`;
    const cards = await sql(query, params);
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Failed to get cards:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
