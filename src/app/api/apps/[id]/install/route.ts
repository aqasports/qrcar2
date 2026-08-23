import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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
      return NextResponse.json({ success: false, error: 'Forbidden: Seuls les propriétaires ou administrateurs peuvent installer des applications.' }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const userId = session.user.id;

    // 1. Fetch App
    const appRows = await sql(
      `SELECT * FROM apps WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (appRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application introuvable' }, { status: 404 });
    }

    const app = appRows[0];
    if (app.status !== 'published' && !(app.visibility === 'private' && app.owner_organization_id === orgId)) {
      return NextResponse.json({ success: false, error: 'Cette application n\'est pas disponible à l\'installation' }, { status: 400 });
    }

    const requestedScopes = typeof app.requested_scopes === 'string'
      ? JSON.parse(app.requested_scopes)
      : app.requested_scopes || [];

    // 2. Insert or update app install
    const installRows = await sql(
      `INSERT INTO app_installs (
         app_id,
         organization_id,
         granted_scopes,
         installed_by_user_id,
         status,
         installed_at,
         uninstalled_at
       ) VALUES ($1, $2, $3, $4, 'active', NOW(), NULL)
       ON CONFLICT (app_id, organization_id) DO UPDATE
       SET status = 'active',
           granted_scopes = $3,
           installed_by_user_id = $4,
           installed_at = NOW(),
           uninstalled_at = NULL
       RETURNING *`,
      [app.id, orgId, JSON.stringify(requestedScopes), userId]
    );

    const install = installRows[0];

    // 3. Generate initial API key for the install if none exists
    const existingKeyRows = await sql(
      `SELECT id FROM api_keys WHERE app_install_id = $1 AND revoked_at IS NULL LIMIT 1`,
      [install.id]
    );

    let rawToken: string | null = null;
    if (existingKeyRows.length === 0) {
      const randomHex = crypto.randomBytes(24).toString('hex');
      rawToken = `qrc_live_${randomHex}`;
      const keyPrefix = rawToken.slice(0, 16);
      const hashedSecret = await bcrypt.hash(rawToken, 10);

      await sql(
        `INSERT INTO api_keys (
           app_install_id,
           organization_id,
           name,
           key_prefix,
           hashed_secret,
           scopes,
           created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [install.id, orgId, `${app.name} Key`, keyPrefix, hashedSecret, JSON.stringify(requestedScopes)]
      );
    }

    // 4. Log Audit
    await logAudit({
      organizationId: orgId,
      userId,
      entityType: 'app_install',
      entityId: install.id,
      action: 'create',
      metadata: { appId: app.id, appName: app.name, grantedScopes: requestedScopes },
    });

    return NextResponse.json({
      success: true,
      data: {
        install,
        rawToken, // Provided if newly generated
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
