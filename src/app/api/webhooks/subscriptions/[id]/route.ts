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
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const orgId = session.user.organizationId;
    const userId = session.user.id;

    const rows = await sql(
      `DELETE FROM webhook_subscriptions
       WHERE id = $1 AND organization_id = $2
       RETURNING id, target_url`,
      [id, orgId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Abonnement webhook introuvable' }, { status: 404 });
    }

    await logAudit({
      organizationId: orgId,
      userId,
      entityType: 'webhook_subscription',
      entityId: id,
      action: 'delete',
      metadata: { target_url: rows[0].target_url },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
