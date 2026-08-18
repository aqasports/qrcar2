import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// PATCH /api/platform-admin/card-designs/[id] - Approve or Reject card design
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: designId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, isPlatformAdmin, id: userId } = session.user;
  if (!isPlatformAdmin && role !== 'platform_admin') {
    return NextResponse.json({ error: 'Forbidden. Platform Admin access required.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, rejection_reason } = body; // action: 'approve' | 'reject'

    const existing = await sql(`SELECT * FROM card_designs WHERE id = $1 LIMIT 1`, [designId]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Card design not found' }, { status: 404 });
    }

    const design = existing[0];

    if (action === 'approve') {
      const updatedRows = await sql(
        `
        UPDATE card_designs
        SET status = 'approved',
            approved_at = CURRENT_TIMESTAMP,
            reviewed_by = $1,
            rejection_reason = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `,
        [userId, designId]
      );

      await logAudit({
        organizationId: design.organization_id,
        userId,
        entityType: 'card_designs',
        entityId: designId,
        action: 'update',
        metadata: { status: 'approved', approved_by: userId },
      });

      return NextResponse.json(updatedRows[0]);
    } else if (action === 'reject') {
      if (!rejection_reason) {
        return NextResponse.json(
          { error: 'Un motif de refus est obligatoire pour informer l’atelier.' },
          { status: 400 }
        );
      }

      const updatedRows = await sql(
        `
        UPDATE card_designs
        SET status = 'rejected',
            rejection_reason = $1,
            reviewed_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `,
        [rejection_reason.trim(), userId, designId]
      );

      await logAudit({
        organizationId: design.organization_id,
        userId,
        entityType: 'card_designs',
        entityId: designId,
        action: 'update',
        metadata: { status: 'rejected', rejection_reason, rejected_by: userId },
      });

      return NextResponse.json(updatedRows[0]);
    } else {
      return NextResponse.json({ error: 'Action invalide (approve ou reject attendu)' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Failed to review card design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
