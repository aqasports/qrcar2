import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { getStore } from '@netlify/blobs';

// GET /api/invoices/[id]/download - Stream invoice PDF from Netlify Blobs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const { searchParams } = new URL(req.url);
  const publicToken = searchParams.get('token') || '';

  const session = await getServerSession(authOptions);

  try {
    let isAuthorized = false;

    // 1. If staff session exists, verify it belongs to user's org
    if (session) {
      const orgCheck = await sql(
        `SELECT 1 FROM invoices WHERE id = $1 AND organization_id = $2 LIMIT 1`,
        [invoiceId, session.user.organizationId]
      );
      if (orgCheck.length > 0 || session.user.isPlatformAdmin) {
        isAuthorized = true;
      }
    } else if (publicToken) {
      // 2. If public, verify card token matches the vehicle of the invoice
      const verification = await sql(
        `
        SELECT i.id, i.invoice_number 
        FROM invoices i
        JOIN actions a ON i.action_id = a.id AND a.organization_id = i.organization_id
        JOIN pvc_cards c ON c.vehicle_id = a.vehicle_id AND c.organization_id = i.organization_id
        WHERE i.id = $1 AND c.token = $2 AND c.status = 'active'
        LIMIT 1
      `,
        [invoiceId, publicToken]
      );

      if (verification.length > 0) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new NextResponse('Unauthorized access to invoice document', { status: 401 });
    }

    // 3. Fetch invoice details to get name
    const invoiceRows = await sql(`SELECT invoice_number FROM invoices WHERE id = $1 LIMIT 1`, [invoiceId]);
    if (invoiceRows.length === 0) {
      return new NextResponse('Invoice record not found', { status: 404 });
    }
    const invoice = invoiceRows[0];

    // 4. Retrieve PDF from Netlify Blobs
    const store = getStore({ name: 'invoices' });
    const buffer = await store.get(invoiceId, { type: 'arrayBuffer' });

    if (!buffer) {
      return new NextResponse('Invoice PDF document not found in storage store', { status: 404 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Failed to download invoice:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
