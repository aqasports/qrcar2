import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(
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

    // 1. Find install
    const installRows = await sql(
      `SELECT id, app_id FROM app_installs 
       WHERE app_id = $1 AND organization_id = $2 AND status = 'active'
       LIMIT 1`,
      [id, orgId]
    );

    if (installRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application non installée' }, { status: 404 });
    }

    const installId = installRows[0].id;

    // 2. Mark install as uninstalled
    await sql(
      `UPDATE app_installs 
       SET status = 'uninstalled', uninstalled_at = NOW() 
       WHERE id = $1`,
      [installId]
    );

    // 3. Revoke all attached API keys
    await sql(
      `UPDATE api_keys 
       SET revoked_at = NOW() 
       WHERE app_install_id = $1 AND revoked_at IS NULL`,
      [installId]
    );

    // 4. Deactivate webhook subscriptions
    await sql(
      `UPDATE webhook_subscriptions 
       SET active = false, updated_at = NOW() 
       WHERE app_install_id = $1`,
      [installId]
    );

    // 5. Log Audit
    await logAudit({
      organizationId: orgId,
      userId,
      entityType: 'app_install',
      entityId: installId,
      action: 'delete',
      metadata: { appId: id, action: 'uninstall' },
    });

    return NextResponse.json({
      success: true,
      message: 'Application désinstallée avec succès',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
