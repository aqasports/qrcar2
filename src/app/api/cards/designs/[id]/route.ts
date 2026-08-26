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
      front_image_url,
      back_image_url,
      front_image_position,
      front_image_opacity,
      front_image_scale,
      back_image_position,
      back_image_opacity,
      back_image_scale,
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
      contact_email,
      submission_notes,
      requested_batch_quantity,
    } = body;

    const updatedRows = await sql(
      `
      UPDATE card_designs
      SET name = COALESCE($1, name),
          layout_preset = COALESCE($2, layout_preset),
          front_logo_url = COALESCE($3, front_logo_url),
          front_image_url = COALESCE($4, front_image_url),
          back_image_url = COALESCE($5, back_image_url),
          front_image_position = COALESCE($6, front_image_position),
          front_image_opacity = COALESCE($7, front_image_opacity),
          front_image_scale = COALESCE($8, front_image_scale),
          back_image_position = COALESCE($9, back_image_position),
          back_image_opacity = COALESCE($10, back_image_opacity),
          back_image_scale = COALESCE($11, back_image_scale),
          front_headline = COALESCE($12, front_headline),
          front_subheadline = COALESCE($13, front_subheadline),
          front_bg_color = COALESCE($14, front_bg_color),
          front_accent_color = COALESCE($15, front_accent_color),
          front_text_color = COALESCE($16, front_text_color),
          back_bg_color = COALESCE($17, back_bg_color),
          back_text_color = COALESCE($18, back_text_color),
          back_contact_phone = COALESCE($19, back_contact_phone),
          back_address = COALESCE($20, back_address),
          back_emergency_text = COALESCE($21, back_emergency_text),
          is_white_label = COALESCE($22, is_white_label),
          contact_email = COALESCE($23, contact_email),
          submission_notes = COALESCE($24, submission_notes),
          requested_batch_quantity = COALESCE($25, requested_batch_quantity),
          status = 'draft',
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $26 AND organization_id = $27
      RETURNING *
    `,
      [
        name?.trim() || null,
        layout_preset || null,
        front_image_url !== undefined ? front_image_url : front_logo_url !== undefined ? front_logo_url : null,
        front_image_url !== undefined ? front_image_url : null,
        back_image_url !== undefined ? back_image_url : null,
        front_image_position || null,
        front_image_opacity !== undefined ? parseFloat(front_image_opacity) : null,
        front_image_scale !== undefined ? parseInt(front_image_scale, 10) : null,
        back_image_position || null,
        back_image_opacity !== undefined ? parseFloat(back_image_opacity) : null,
        back_image_scale !== undefined ? parseInt(back_image_scale, 10) : null,
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
        contact_email !== undefined ? contact_email : null,
        submission_notes !== undefined ? submission_notes : null,
        requested_batch_quantity !== undefined ? parseInt(requested_batch_quantity, 10) : null,
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
