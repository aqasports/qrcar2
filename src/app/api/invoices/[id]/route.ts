import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// PATCH /api/invoices/[id] - Update invoice status (e.g. issue or mark paid)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !['draft', 'issued', 'paid', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check invoice exists
    const check = await sql(`SELECT * FROM invoices WHERE id = $1 LIMIT 1`, [invoiceId]);
    if (check.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const invoice = check[0];

    // Enforce state transitions
    if (invoice.status === 'paid' && status !== 'paid') {
      return NextResponse.json({ error: 'Cannot modify status of a paid invoice' }, { status: 400 });
    }
    if (invoice.status === 'cancelled' && status !== 'cancelled') {
      return NextResponse.json({ error: 'Cannot modify status of a cancelled invoice' }, { status: 400 });
    }

    // Update status
    const updatedRows = await sql(`
      UPDATE invoices
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, invoiceId]);

    const updated = updatedRows[0];

    // Log audit
    await logAudit({
      userId,
      entityType: 'invoices',
      entityId: invoiceId,
      action: 'update',
      metadata: {
        invoice_number: invoice.invoice_number,
        old_status: invoice.status,
        new_status: status
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update invoice status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
