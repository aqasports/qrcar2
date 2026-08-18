import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/organization/branding - Get current organization's branding and settings
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    const orgRows = await sql(
      `
      SELECT 
        o.id,
        o.name,
        o.slug,
        o.logo_url,
        o.brand_color_primary,
        o.brand_color_secondary,
        o.locale,
        o.currency,
        o.timezone,
        b.address,
        b.phone
      FROM organizations o
      LEFT JOIN branches b ON b.organization_id = o.id AND b.is_main = true
      WHERE o.id = $1
      LIMIT 1
    `,
      [organizationId]
    );

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(orgRows[0]);
  } catch (error: any) {
    console.error('Failed to get organization branding:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/organization/branding - Update branding, logo, colors, locale, currency
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId } = session.user;
  if (role !== 'owner' && role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Seuls les propriétaires et administrateurs peuvent modifier les paramètres de l’atelier.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      logo_url,
      brand_color_primary,
      brand_color_secondary,
      locale,
      currency,
      timezone,
      address,
      phone,
    } = body;

    // Update organizations table
    const updatedOrg = await sql(
      `
      UPDATE organizations
      SET name = COALESCE($1, name),
          logo_url = COALESCE($2, logo_url),
          brand_color_primary = COALESCE($3, brand_color_primary),
          brand_color_secondary = COALESCE($4, brand_color_secondary),
          locale = COALESCE($5, locale),
          currency = COALESCE($6, currency),
          timezone = COALESCE($7, timezone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `,
      [
        name?.trim() || null,
        logo_url?.trim() || null,
        brand_color_primary?.trim() || null,
        brand_color_secondary?.trim() || null,
        locale || null,
        currency || null,
        timezone || null,
        organizationId,
      ]
    );

    // Update main branch address and phone if provided
    if (address !== undefined || phone !== undefined) {
      await sql(
        `
        UPDATE branches
        SET address = COALESCE($1, address),
            phone = COALESCE($2, phone),
            updated_at = CURRENT_TIMESTAMP
        WHERE organization_id = $3 AND is_main = true
      `,
        [address || null, phone || null, organizationId]
      );
    }

    await logAudit({
      organizationId,
      userId,
      entityType: 'organizations',
      entityId: organizationId,
      action: 'update',
      metadata: {
        changes: {
          name,
          brand_color_primary,
          brand_color_secondary,
          locale,
          currency,
        },
      },
    });

    return NextResponse.json(updatedOrg[0]);
  } catch (error: any) {
    console.error('Failed to update organization branding:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
