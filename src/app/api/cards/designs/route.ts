import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getOrganizationPlanDetails } from '@/lib/plans';

// GET /api/cards/designs - List all card designs scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    const designs = await sql(
      `
      SELECT * FROM card_designs
      WHERE organization_id = $1
      ORDER BY updated_at DESC
    `,
      [organizationId]
    );

    return NextResponse.json(designs);
  } catch (error: any) {
    console.error('Failed to get card designs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/cards/designs - Create a new card design (draft)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
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

    if (!name) {
      return NextResponse.json({ error: 'Le nom du modèle de carte est requis.' }, { status: 400 });
    }

    // Plan tier feature gating
    const planDetails = await getOrganizationPlanDetails(organizationId);
    const studioTier = planDetails.plan.cardStudioTier; // 'template' | 'full' | 'full_whitelabel'

    const wantsCustomColorsOrLogo = Boolean(
      front_logo_url ||
        front_image_url ||
        back_image_url ||
        (front_bg_color && front_bg_color !== '#0f172a') ||
        (front_accent_color && front_accent_color !== '#3b82f6')
    );

    if (studioTier === 'template' && wantsCustomColorsOrLogo) {
      return NextResponse.json(
        {
          error:
            'La personnalisation avancée des couleurs et du logo nécessite le forfait Pro ou Enterprise. Sur le forfait Starter, vous pouvez choisir parmi les styles préréglés.',
        },
        { status: 403 }
      );
    }

    const whiteLabelAllowed = studioTier === 'full_whitelabel';
    const effectiveWhiteLabel = is_white_label && whiteLabelAllowed;

    const rows = await sql(
      `
      INSERT INTO card_designs (
        organization_id, name, status, layout_preset,
        front_logo_url, front_image_url, back_image_url,
        front_image_position, front_image_opacity, front_image_scale,
        back_image_position, back_image_opacity, back_image_scale,
        front_headline, front_subheadline,
        front_bg_color, front_accent_color, front_text_color,
        back_bg_color, back_text_color, back_contact_phone,
        back_address, back_emergency_text, is_white_label,
        contact_email, submission_notes, requested_batch_quantity
      )
      VALUES (
        $1, $2, 'draft', $3,
        $4, $5, $6,
        $7, $8, $9,
        $10, $11, $12,
        $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23,
        $24, $25, $26
      )
      RETURNING *
    `,
      [
        organizationId,
        name.trim(),
        layout_preset || 'modern_slate',
        front_image_url || front_logo_url || null,
        front_image_url || front_logo_url || null,
        back_image_url || null,
        front_image_position || 'header_logo',
        parseFloat(front_image_opacity) || 1.0,
        parseInt(front_image_scale, 10) || 100,
        back_image_position || 'background_watermark',
        parseFloat(back_image_opacity) || 0.2,
        parseInt(back_image_scale, 10) || 80,
        front_headline || null,
        front_subheadline || null,
        front_bg_color || '#0f172a',
        front_accent_color || '#3b82f6',
        front_text_color || '#ffffff',
        back_bg_color || '#0f172a',
        back_text_color || '#ffffff',
        back_contact_phone || null,
        back_address || null,
        back_emergency_text || null,
        effectiveWhiteLabel,
        contact_email || null,
        submission_notes || null,
        parseInt(requested_batch_quantity, 10) || 100,
      ]
    );

    const design = rows[0];

    await logAudit({
      organizationId,
      userId,
      entityType: 'card_designs',
      entityId: design.id,
      action: 'create',
      metadata: { name: design.name, layout_preset: design.layout_preset },
    });

    return NextResponse.json(design, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create card design:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
