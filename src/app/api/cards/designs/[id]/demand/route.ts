import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { uploadImageToThirdParty } from '@/lib/third-party-upload';
import { buildPvcDemandPackage, validateCardDesignForProduction } from '@/lib/pvc-demand-protocol';
import { apiUnauthorized, apiForbidden, apiNotFound, apiError, apiServerError } from '@/lib/api/response';

// POST /api/cards/designs/[id]/demand - Transmit factory PVC printing demand protocol package
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: designId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, id: userId, organizationId, orgName } = session.user;
  if (role === 'technician') {
    return apiForbidden('Non autorisé à soumettre des demandes d’impression usine.');
  }

  try {
    const body = await req.json();
    const {
      front_rendered_base64,
      back_rendered_base64,
      requested_batch_quantity = 100,
      preferred_finish = 'Matte Silk',
      submission_notes = '',
      contact_email,
    } = body;

    // 1. Fetch current design
    const existing = await sql(
      `SELECT * FROM card_designs WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [designId, organizationId]
    );

    if (existing.length === 0) {
      return apiNotFound('Modèle de carte introuvable.');
    }

    const design = existing[0];
    if (design.status === 'approved') {
      return apiError('Ce modèle est déjà validé pour impression.', 'ALREADY_APPROVED', 400);
    }

    // 2. Pre-flight validation
    const validation = validateCardDesignForProduction(design);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Le modèle ne respecte pas les critères de production.',
          details: validation.errors,
        },
        { status: 422 }
      );
    }

    // 3. Upload Front Rendered Snapshot to Third-Party Server
    let frontRenderUrl = design.front_rendered_preview_url || design.front_logo_url || '';
    let frontUploadProvider = 'local_cdn';
    if (front_rendered_base64) {
      const frontUpload = await uploadImageToThirdParty({
        fileBase64: front_rendered_base64,
        filename: `cr80_front_render_${designId}.png`,
        organizationId,
        tags: ['pvc_render', 'front_face', designId],
      });
      frontRenderUrl = frontUpload.url;
      frontUploadProvider = frontUpload.provider;
    }

    // 4. Upload Back Rendered Snapshot to Third-Party Server
    let backRenderUrl = design.back_rendered_preview_url || '';
    let backUploadProvider = 'local_cdn';
    if (back_rendered_base64) {
      const backUpload = await uploadImageToThirdParty({
        fileBase64: back_rendered_base64,
        filename: `cr80_back_render_${designId}.png`,
        organizationId,
        tags: ['pvc_render', 'back_face', designId],
      });
      backRenderUrl = backUpload.url;
      backUploadProvider = backUpload.provider;
    }

    // 5. Fetch organization contact information
    const orgRows = await sql(
      `SELECT name, phone, email, address, wilaya FROM organizations WHERE id = $1 LIMIT 1`,
      [organizationId]
    );
    const org = orgRows[0] || { name: orgName };

    // 6. Build the standardized PVC Demand Protocol Package
    const demandPackage = buildPvcDemandPackage({
      designId: design.id,
      designName: design.name,
      layoutPreset: design.layout_preset,
      isWhiteLabel: Boolean(design.is_white_label),
      frontBg: design.front_bg_color || '#0f172a',
      frontAccent: design.front_accent_color || '#3b82f6',
      frontText: design.front_text_color || '#ffffff',
      backBg: design.back_bg_color || '#0f172a',
      backText: design.back_text_color || '#ffffff',
      frontHeadline: design.front_headline || org.name,
      frontSubheadline: design.front_subheadline || 'Passeport d’Entretien Numérique',
      backContactPhone: design.back_contact_phone || org.phone || '',
      backAddress: design.back_address || org.address || '',
      backEmergencyText: design.back_emergency_text || '',
      frontImageUrl: design.front_image_url || design.front_logo_url,
      frontImagePosition: design.front_image_position,
      frontImageOpacity: parseFloat(design.front_image_opacity) || 1.0,
      frontImageScale: parseInt(design.front_image_scale, 10) || 100,
      backImageUrl: design.back_image_url,
      backImagePosition: design.back_image_position,
      backImageOpacity: parseFloat(design.back_image_opacity) || 0.2,
      backImageScale: parseInt(design.back_image_scale, 10) || 80,
      frontRenderedPreviewUrl: frontRenderUrl,
      backRenderedPreviewUrl: backRenderUrl,
      frontUploadProvider,
      backUploadProvider,
      organization: {
        id: organizationId,
        name: org.name,
        phone: org.phone,
        email: org.email,
        address: org.address,
        wilaya: org.wilaya,
      },
      requestedBatchQuantity: parseInt(requested_batch_quantity, 10) || 100,
      preferredFinish: preferred_finish,
      submissionNotes: submission_notes,
      contactEmail: contact_email || org.email,
    });

    // 7. Update database record with protocol metadata
    const updatedRows = await sql(
      `
      UPDATE card_designs
      SET status = 'submitted',
          front_rendered_preview_url = $1,
          back_rendered_preview_url = $2,
          print_specs = $3,
          demand_package = $4,
          submission_notes = $5,
          contact_email = $6,
          requested_batch_quantity = $7,
          submitted_at = CURRENT_TIMESTAMP,
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND organization_id = $9
      RETURNING *
    `,
      [
        frontRenderUrl,
        backRenderUrl,
        JSON.stringify(demandPackage.printSpecs),
        JSON.stringify(demandPackage),
        submission_notes || null,
        contact_email || null,
        parseInt(requested_batch_quantity, 10) || 100,
        designId,
        organizationId,
      ]
    );

    const updated = updatedRows[0];

    // 8. Log audit trail
    await logAudit({
      organizationId,
      userId,
      entityType: 'card_designs',
      entityId: designId,
      action: 'update',
      metadata: {
        action_type: 'pvc_factory_demand_submitted',
        demand_id: demandPackage.demandId,
        name: updated.name,
        batch_qty: requested_batch_quantity,
        front_provider: frontUploadProvider,
        back_provider: backUploadProvider,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Demande de fabrication PVC transmise avec succès à notre atelier de production.',
      demandId: demandPackage.demandId,
      design: updated,
      demandPackage,
    });
  } catch (error: any) {
    console.error('Failed to submit PVC demand protocol:', error);
    return apiServerError();
  }
}
