import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/marketplace/listings/[id] - Get single listing with seller profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await sql(
      `
      SELECT 
        ml.*,
        o.name as seller_garage_name,
        o.slug as seller_slug,
        o.logo_url as seller_logo,
        b.phone as seller_phone,
        b.address as seller_address,
        b.city as seller_city,
        p.name as seller_plan_name,
        p.directory_tier as seller_directory_tier
      FROM marketplace_listings ml
      JOIN organizations o ON ml.organization_id = o.id
      LEFT JOIN branches b ON b.organization_id = o.id AND b.is_main = true
      LEFT JOIN plans p ON o.plan_id = p.id
      WHERE ml.id = $1
      LIMIT 1
    `,
      [listingId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Failed to get marketplace listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/marketplace/listings/[id] - Single-tenant update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId, isPlatformAdmin } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const existing = isPlatformAdmin
      ? await sql(`SELECT * FROM marketplace_listings WHERE id = $1 LIMIT 1`, [listingId])
      : await sql(`SELECT * FROM marketplace_listings WHERE id = $1 AND organization_id = $2 LIMIT 1`, [
          listingId,
          organizationId,
        ]);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Annonce introuvable ou vous n\'avez pas les permissions pour la modifier.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      title,
      oem_number,
      category,
      condition,
      compatibility_makes,
      compatibility_models,
      compatibility_years,
      price,
      quantity,
      location_wilaya,
      description,
      status,
      image_urls,
    } = body;

    const updatedRows = await sql(
      `
      UPDATE marketplace_listings
      SET title = COALESCE($1, title),
          oem_number = COALESCE($2, oem_number),
          category = COALESCE($3, category),
          condition = COALESCE($4, condition),
          compatibility_makes = COALESCE($5, compatibility_makes),
          compatibility_models = COALESCE($6, compatibility_models),
          compatibility_years = COALESCE($7, compatibility_years),
          price = COALESCE($8, price),
          quantity = COALESCE($9, quantity),
          location_wilaya = COALESCE($10, location_wilaya),
          description = COALESCE($11, description),
          status = COALESCE($12, status),
          image_urls = COALESCE($13, image_urls),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `,
      [
        title?.trim() || null,
        oem_number?.trim() || null,
        category || null,
        condition || null,
        compatibility_makes || null,
        compatibility_models || null,
        compatibility_years || null,
        price !== undefined ? parseFloat(price) : null,
        quantity !== undefined ? parseInt(quantity, 10) : null,
        location_wilaya || null,
        description !== undefined ? description : null,
        status || null,
        image_urls !== undefined ? JSON.stringify(image_urls) : null,
        listingId,
      ]
    );

    const updated = updatedRows[0];

    await logAudit({
      organizationId: updated.organization_id,
      userId,
      entityType: 'marketplace_listings',
      entityId: listingId,
      action: 'update',
      metadata: { status: updated.status, price: updated.price },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update marketplace listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/marketplace/listings/[id] - Single-tenant delete
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId, isPlatformAdmin } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const existing = isPlatformAdmin
      ? await sql(`SELECT * FROM marketplace_listings WHERE id = $1 LIMIT 1`, [listingId])
      : await sql(`SELECT * FROM marketplace_listings WHERE id = $1 AND organization_id = $2 LIMIT 1`, [
          listingId,
          organizationId,
        ]);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    }

    await sql(`DELETE FROM marketplace_listings WHERE id = $1`, [listingId]);

    await logAudit({
      organizationId: existing[0].organization_id,
      userId,
      entityType: 'marketplace_listings',
      entityId: listingId,
      action: 'delete',
    });

    return NextResponse.json({ success: true, message: 'Annonce supprimée avec succès.' });
  } catch (error: any) {
    console.error('Failed to delete marketplace listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
