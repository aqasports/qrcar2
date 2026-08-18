import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/users - List users in active organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, organizationId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await sql(
      `
      SELECT u.id, u.username, u.email, om.role 
      FROM users u
      JOIN organization_members om ON u.id = om.user_id
      WHERE u.active = true AND om.organization_id = $1
      ORDER BY u.username ASC
    `,
      [organizationId]
    );
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
