import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== 'owner' && role !== 'super_admin' && role !== 'platform_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const userId = session.user.id;

    const updateRows = await sql(
      `UPDATE api_keys 
       SET revoked_at = NOW() 
       WHERE id = $1 AND organization_id = $2 AND revoked_at IS NULL
       RETURNING id, name, key_prefix`,
      [id, orgId]
    );

    if (updateRows.length === 0) {
      return NextResponse.json({ success: false, error: 'API key not found or already revoked' }, { status: 404 });
    }

    const revokedKey = updateRows[0];

    // Record Audit Log
    await logAudit({
      organizationId: orgId,
      userId,
      entityType: 'api_key',
      entityId: revokedKey.id,
      action: 'revoke',
      metadata: { keyPrefix: revokedKey.key_prefix, name: revokedKey.name },
    });

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
