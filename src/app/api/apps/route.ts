import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.organizationId || '';

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all'; // 'all', 'installed'

    let query = `
      SELECT 
        a.id,
        a.name,
        a.slug,
        a.description,
        a.icon_url,
        a.visibility,
        a.status,
        a.requested_scopes,
        a.created_at,
        da.company_name as developer_name,
        da.contact_email as developer_email,
        ai.id as install_id,
        ai.status as install_status,
        ai.granted_scopes,
        ai.installed_at
      FROM apps a
      JOIN developer_accounts da ON a.developer_account_id = da.id
      LEFT JOIN app_installs ai ON a.id = ai.app_id AND ai.organization_id = $1 AND ai.status = 'active'
      WHERE a.visibility = 'public' AND a.status = 'published'
    `;
    const params: any[] = [orgId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (a.name ILIKE $${params.length} OR a.description ILIKE $${params.length} OR da.company_name ILIKE $${params.length})`;
    }

    if (filter === 'installed') {
      query += ` AND ai.id IS NOT NULL`;
    }

    query += ` ORDER BY a.created_at DESC`;

    const rows = await sql(query, params);

    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      iconUrl: r.icon_url,
      visibility: r.visibility,
      status: r.status,
      requestedScopes: typeof r.requested_scopes === 'string' ? JSON.parse(r.requested_scopes) : r.requested_scopes || [],
      createdAt: r.created_at,
      developer: {
        name: r.developer_name || 'Développeur Partenaire',
        email: r.developer_email,
      },
      isInstalled: Boolean(r.install_id && r.install_status === 'active'),
      install: r.install_id
        ? {
            id: r.install_id,
            status: r.install_status,
            grantedScopes: typeof r.granted_scopes === 'string' ? JSON.parse(r.granted_scopes) : r.granted_scopes || [],
            installedAt: r.installed_at,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const {
      name,
      description,
      iconUrl,
      requestedScopes = ['read_vehicles'],
      redirectUris = [],
      webhookCallbackUrl,
    } = body;

    if (!name || !description) {
      return NextResponse.json({ success: false, error: 'Name and description are required' }, { status: 400 });
    }

    // 1. Ensure Developer Account exists
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
        [userId, session.user.username || 'Partner Developer', session.user.username || 'dev@qrcar.pro']
      );
      devAccountId = newDevAccount[0]?.id;
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    // 2. Insert App in submitted status
    const appRows = await sql(
      `INSERT INTO apps (
         developer_account_id,
         name,
         slug,
         description,
         icon_url,
         visibility,
         status,
         requested_scopes,
         redirect_uris,
         webhook_callback_url,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, 'public', 'submitted', $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        devAccountId,
        name.trim(),
        slug,
        description.trim(),
        iconUrl || null,
        JSON.stringify(requestedScopes),
        JSON.stringify(redirectUris),
        webhookCallbackUrl || null,
      ]
    );

    const app = appRows[0];

    // 3. Log Audit
    if (session.user.organizationId) {
      await logAudit({
        organizationId: session.user.organizationId,
        userId,
        entityType: 'app',
        entityId: app.id,
        action: 'create',
        metadata: { name: app.name, slug: app.slug, visibility: 'public' },
      });
    }

    return NextResponse.json({
      success: true,
      data: app,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
