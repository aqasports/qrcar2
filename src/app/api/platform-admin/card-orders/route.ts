import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// GET /api/platform-admin/card-orders - List all fulfillment orders across all garages
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, isPlatformAdmin } = session.user;
  if (!isPlatformAdmin && role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden. Platform Admin access required.' }, { status: 403 });
  }

  try {
    const orders = await sql(`
      SELECT 
        co.*,
        o.name as org_name,
        o.slug as org_slug,
        cd.name as design_name,
        cd.layout_preset,
        cd.front_logo_url,
        cd.front_bg_color,
        cd.front_accent_color,
        cd.front_headline,
        cd.back_address,
        cd.back_contact_phone
      FROM card_orders co
      JOIN organizations o ON co.organization_id = o.id
      JOIN card_designs cd ON co.card_design_id = cd.id
      ORDER BY 
        CASE 
          WHEN co.status = 'paid' THEN 1 
          WHEN co.status = 'in_production' THEN 2 
          WHEN co.status = 'shipped' THEN 3 
          WHEN co.status = 'pending_payment' THEN 4 
          ELSE 5 
        END,
        co.created_at DESC
    `);

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Failed to get platform admin card orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
