import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/cards/designs/[id] - Get single card design
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: designId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId, isPlatformAdmin } = session.user;

  try {
    const rows = isPlatformAdmin
      ? await sql(`SELECT * FROM card_designs WHERE id = $1 LIMIT 1`, [designId])
      : await sql(
          `SELECT * FROM card_designs WHERE id = $1 AND organization_id = $2 LIMIT 1`,
          [designId, organizationId]
        );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Card design not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Failed to get card design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/cards/designs/[id] - Update design (only editable when draft or rejected)
export async function PATCH(
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

    const currentDesign = existing[0];
    if (currentDesign.status === 'submitted') {
      return NextResponse.json(
        { error: 'Ce modèle est actuellement en cours de vérification par l’équipe d’impression et ne peut pas être modifié.' },
        { status: 400 }
      );
    }
    if (currentDesign.status === 'approved') {
      return NextResponse.json(
        { error: 'Ce modèle a été validé pour impression. Créez un nouveau modèle pour apporter des modifications.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      layout_preset,
      front_logo_url,
      front_headline,
      front_subheadline,
      front_bg_color,
      front_accent_color,
      front_text_color,
      back_bg_color,
      back_text_color,
      back_contact_phone,
      back_address,
      back_emergency_text,
      is_white_label,
    } = body;

    const updatedRows = await sql(
      `
      UPDATE card_designs
      SET name = COALESCE($1, name),
          layout_preset = COALESCE($2, layout_preset),
          front_logo_url = COALESCE($3, front_logo_url),
          front_headline = COALESCE($4, front_headline),
          front_subheadline = COALESCE($5, front_subheadline),
          front_bg_color = COALESCE($6, front_bg_color),
          front_accent_color = COALESCE($7, front_accent_color),
          front_text_color = COALESCE($8, front_text_color),
          back_bg_color = COALESCE($9, back_bg_color),
          back_text_color = COALESCE($10, back_text_color),
          back_contact_phone = COALESCE($11, back_contact_phone),
          back_address = COALESCE($12, back_address),
          back_emergency_text = COALESCE($13, back_emergency_text),
          is_white_label = COALESCE($14, is_white_label),
          status = 'draft',
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 AND organization_id = $16
      RETURNING *
    `,
      [
        name?.trim() || null,
        layout_preset || null,
        front_logo_url !== undefined ? front_logo_url : null,
        front_headline !== undefined ? front_headline : null,
        front_subheadline !== undefined ? front_subheadline : null,
        front_bg_color || null,
        front_accent_color || null,
        front_text_color || null,
        back_bg_color || null,
        back_text_color || null,
        back_contact_phone !== undefined ? back_contact_phone : null,
        back_address !== undefined ? back_address : null,
        back_emergency_text !== undefined ? back_emergency_text : null,
        is_white_label !== undefined ? is_white_label : null,
        designId,
        organizationId,
      ]
    );

    const updated = updatedRows[0];

    await logAudit({
      organizationId,
      userId,
      entityType: 'card_designs',
      entityId: designId,
      action: 'update',
      metadata: { name: updated.name, status: updated.status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update card design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/cards/designs/[id] - Delete a draft or rejected card design
export async function DELETE(
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

    if (existing[0].status === 'approved') {
      return NextResponse.json({ error: 'Impossible de supprimer un modèle validé.' }, { status: 400 });
    }

    await sql(`DELETE FROM card_designs WHERE id = $1 AND organization_id = $2`, [
      designId,
      organizationId,
    ]);

    await logAudit({
      organizationId,
      userId,
      entityType: 'card_designs',
      entityId: designId,
      action: 'delete',
    });

    return NextResponse.json({ success: true, message: 'Modèle supprimé avec succès.' });
  } catch (error: any) {
    console.error('Failed to delete card design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
