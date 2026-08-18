import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/audit - Fetch audit logs scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, organizationId, isPlatformAdmin } = session.user;
  // Restrict to owner / super_admin (or platform_admin)
  if (role !== 'owner' && role !== 'super_admin' && !isPlatformAdmin) {
    return NextResponse.json(
      { error: 'Forbidden. Access restricted to Organization Owners and Administrators.' },
      { status: 403 }
    );
  }

  try {
    const logs = await sql(
      `
      SELECT al.*, u.username as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = $1
      ORDER BY al.created_at DESC
      LIMIT 200
    `,
      [organizationId]
    );
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
