import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.organizationId || '';

    const rows = await sql(
      `SELECT 
         a.*,
         da.company_name as developer_name,
         da.contact_email as developer_email,
         da.website_url as developer_website,
         ai.id as install_id,
         ai.status as install_status,
         ai.granted_scopes,
         ai.installed_at
       FROM apps a
       JOIN developer_accounts da ON a.developer_account_id = da.id
       LEFT JOIN app_installs ai ON a.id = ai.app_id AND ai.organization_id = $1 AND ai.status = 'active'
       WHERE (a.id = $2 OR a.slug = $2)
       LIMIT 1`,
      [orgId, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const r = rows[0];
    const formatted = {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      iconUrl: r.icon_url,
      visibility: r.visibility,
      status: r.status,
      requestedScopes: typeof r.requested_scopes === 'string' ? JSON.parse(r.requested_scopes) : r.requested_scopes || [],
      webhookCallbackUrl: r.webhook_callback_url,
      createdAt: r.created_at,
      developer: {
        name: r.developer_name || 'Développeur Partenaire',
        email: r.developer_email,
        website: r.developer_website,
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
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
