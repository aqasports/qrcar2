import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    const rows = await sql(
      `SELECT 
         ak.id,
         ak.name,
         ak.key_prefix,
         ak.scopes,
         ak.last_used_at,
         ak.created_at,
         a.name as app_name
       FROM api_keys ak
       JOIN app_installs ai ON ak.app_install_id = ai.id
       JOIN apps a ON ai.app_id = a.id
       WHERE ak.organization_id = $1 AND ak.revoked_at IS NULL
       ORDER BY ak.created_at DESC`,
      [orgId]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Gating: Only owners, super_admins, and platform_admins can generate API keys
    const role = session.user.role;
    if (role !== 'owner' && role !== 'super_admin' && role !== 'platform_admin') {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient privileges to generate API credentials' }, { status: 403 });
    }

    const orgId = session.user.organizationId;
    const userId = session.user.id;
    const body = await req.json();
    const { name = 'Custom Integration', scopes = ['read_vehicles', 'read_actions'] } = body;

    // 1. Ensure Developer Account exists for this user
    let devAccountRows = await sql(
      `SELECT id FROM developer_accounts WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    let devAccountId = devAccountRows[0]?.id;
    if (!devAccountId) {
      const newDevAccount = await sql(
        `INSERT INTO developer_accounts (user_id, company_name, contact_email, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', NOW(), NOW())
         RETURNING id`,
        [userId, session.user.orgName || 'Garage Owner', session.user.username || 'contact@qrcar.pro']
      );
      devAccountId = newDevAccount[0]?.id;
    }

    // 2. Ensure Private App exists for this organization
    const appSlug = `private-app-${orgId.slice(0, 8)}-${Date.now()}`;
    const appRows = await sql(
      `INSERT INTO apps (
         developer_account_id,
         owner_organization_id,
         name,
         slug,
         description,
         visibility,
         status,
         requested_scopes,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, 'Private Organization API Key App', 'private', 'published', $5, NOW(), NOW())
       RETURNING id`,
      [devAccountId, orgId, name, appSlug, JSON.stringify(scopes)]
    );

    const appId = appRows[0]?.id;

    // 3. Create App Install
    const installRows = await sql(
      `INSERT INTO app_installs (
         app_id,
         organization_id,
         granted_scopes,
         installed_by_user_id,
         status,
         installed_at
       ) VALUES ($1, $2, $3, $4, 'active', NOW())
       RETURNING id`,
      [appId, orgId, JSON.stringify(scopes), userId]
    );

    const appInstallId = installRows[0]?.id;

    // 4. Generate Raw Key and Hash
    const randomHex = crypto.randomBytes(24).toString('hex');
    const rawToken = `qrc_live_${randomHex}`;
    const keyPrefix = rawToken.slice(0, 16);
    const hashedSecret = await bcrypt.hash(rawToken, 10);

    // 5. Store API Key
    const apiKeyRows = await sql(
      `INSERT INTO api_keys (
         app_install_id,
         organization_id,
         name,
         key_prefix,
         hashed_secret,
         scopes,
         created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, key_prefix, scopes, created_at`,
      [appInstallId, orgId, name, keyPrefix, hashedSecret, JSON.stringify(scopes)]
    );

    const apiKey = apiKeyRows[0];

    // 6. Record Audit Log
    await logAudit({
      organizationId: orgId,
      userId,
      entityType: 'api_key',
      entityId: apiKey.id,
      action: 'create',
      metadata: { name, scopes, keyPrefix },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...apiKey,
        rawToken, // Revealed only once upon creation
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
