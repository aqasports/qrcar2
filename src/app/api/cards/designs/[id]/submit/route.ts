import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// POST /api/cards/designs/[id]/submit - Submit a card design for platform admin print review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: designId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const existing = await sql(
      `SELECT * FROM card_designs WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [designId, organizationId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Modèle de carte introuvable.' }, { status: 404 });
    }

    const design = existing[0];
    if (design.status === 'approved') {
      return NextResponse.json({ error: 'Ce modèle est déjà validé.' }, { status: 400 });
    }
    if (design.status === 'submitted') {
      return NextResponse.json({ error: 'Ce modèle a déjà été soumis pour validation.' }, { status: 400 });
    }

    const updatedRows = await sql(
      `
      UPDATE card_designs
      SET status = 'submitted',
          submitted_at = CURRENT_TIMESTAMP,
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND organization_id = $2
      RETURNING *
    `,
      [designId, organizationId]
    );

    const updated = updatedRows[0];

    await logAudit({
      organizationId,
      userId,
      entityType: 'card_designs',
      entityId: designId,
      action: 'update',
      metadata: { action_type: 'submitted_for_approval', name: updated.name },
    });

    return NextResponse.json({
      success: true,
      message: 'Modèle soumis avec succès ! Notre équipe technique valide le gabarit sous 24h.',
      design: updated,
    });
  } catch (error: any) {
    console.error('Failed to submit card design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
