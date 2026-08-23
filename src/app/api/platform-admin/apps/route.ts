import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const isPlatformAdmin = Boolean(session?.user?.isPlatformAdmin || session?.user?.role === 'platform_admin');
    if (!isPlatformAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Platform Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

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
        a.rejection_reason,
        a.webhook_callback_url,
        a.reviewed_at,
        a.created_at,
        da.company_name as developer_name,
        da.contact_email as developer_email,
        da.website_url as developer_website,
        u.username as reviewer_name,
        (SELECT COUNT(*) FROM app_installs WHERE app_id = a.id AND status = 'active') as active_installs_count
      FROM apps a
      JOIN developer_accounts da ON a.developer_account_id = da.id
      LEFT JOIN users u ON a.reviewed_by = u.id
      WHERE a.visibility = 'public'
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
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
      rejectionReason: r.rejection_reason,
      webhookCallbackUrl: r.webhook_callback_url,
      reviewedAt: r.reviewed_at,
      reviewerName: r.reviewer_name,
      createdAt: r.created_at,
      developer: {
        name: r.developer_name,
        email: r.developer_email,
        website: r.developer_website,
      },
      activeInstallsCount: parseInt(r.active_installs_count || '0', 10),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
