import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = session.user.organizationId;

    // Fetch all tenant data in parallel
    const [
      orgRows,
      clientsRows,
      vehiclesRows,
      actionsRows,
      partsRows,
      invoicesRows,
      cardsRows,
      appointmentsRows,
    ] = await Promise.all([
      sql(`SELECT * FROM organizations WHERE id = $1`, [orgId]),
      sql(`SELECT * FROM clients WHERE organization_id = $1`, [orgId]),
      sql(`SELECT * FROM vehicles WHERE organization_id = $1`, [orgId]),
      sql(`SELECT * FROM actions WHERE organization_id = $1`, [orgId]),
      sql(`SELECT * FROM parts WHERE organization_id = $1`, [orgId]),
      sql(`SELECT * FROM invoices WHERE organization_id = $1`, [orgId]),
      sql(`SELECT * FROM pvc_cards WHERE organization_id = $1`, [orgId]),
      sql(`SELECT * FROM appointments WHERE organization_id = $1`, [orgId]),
    ]);

    const exportBundle = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        organizationId: orgId,
        platform: 'qrCar Automotive SaaS',
        version: '1.0',
      },
      organization: orgRows[0] || null,
      clients: clientsRows || [],
      vehicles: vehiclesRows || [],
      actions: actionsRows || [],
      parts: partsRows || [],
      invoices: invoicesRows || [],
      pvcCards: cardsRows || [],
      appointments: appointmentsRows || [],
    };

    const response = new NextResponse(JSON.stringify(exportBundle, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="qrcar-export-${orgId.slice(0, 8)}-${Date.now()}.json"`,
      },
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
