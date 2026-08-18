import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { getOrganizationPlanDetails } from '@/lib/plans';

// GET /api/marketplace/listings - Cross-Tenant Search & Catalog
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search')?.trim() || '';
  const category = searchParams.get('category')?.trim() || '';
  const condition = searchParams.get('condition')?.trim() || '';
  const wilaya = searchParams.get('wilaya')?.trim() || '';
  const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : null;
  const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : null;
  const mineOnly = searchParams.get('mine_only') === 'true';

  try {
    let whereConditions = [];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (mineOnly) {
      whereConditions.push(`ml.organization_id = $${paramIdx++}`);
      queryParams.push(organizationId);
    } else {
      whereConditions.push(`ml.status = 'active'`);
    }

    if (search) {
      whereConditions.push(
        `(ml.title ILIKE $${paramIdx} OR ml.oem_number ILIKE $${paramIdx} OR ml.compatibility_makes ILIKE $${paramIdx} OR ml.compatibility_models ILIKE $${paramIdx} OR ml.description ILIKE $${paramIdx})`
      );
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    if (category && category !== 'all') {
      whereConditions.push(`ml.category = $${paramIdx++}`);
      queryParams.push(category);
    }

    if (condition && condition !== 'all') {
      whereConditions.push(`ml.condition = $${paramIdx++}`);
      queryParams.push(condition);
    }

    if (wilaya && wilaya !== 'all') {
      whereConditions.push(`ml.location_wilaya ILIKE $${paramIdx++}`);
      queryParams.push(`%${wilaya}%`);
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      whereConditions.push(`ml.price >= $${paramIdx++}`);
      queryParams.push(minPrice);
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      whereConditions.push(`ml.price <= $${paramIdx++}`);
      queryParams.push(maxPrice);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        ml.*,
        o.name as seller_garage_name,
        o.slug as seller_slug,
        o.logo_url as seller_logo,
        b.phone as seller_phone,
        b.address as seller_address,
        p.name as seller_plan_name,
        p.directory_tier as seller_directory_tier
      FROM marketplace_listings ml
      JOIN organizations o ON ml.organization_id = o.id
      LEFT JOIN branches b ON b.organization_id = o.id AND b.is_main = true
      LEFT JOIN plans p ON o.plan_id = p.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN p.directory_tier = 'spotlight' THEN 1
          WHEN p.directory_tier = 'featured' THEN 2
          ELSE 3
        END,
        ml.created_at DESC
    `;

    const listings = await sql(query, queryParams);

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error('Failed to get marketplace listings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/marketplace/listings - Create listing (single-tenant write, plan quota checked)
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
    // 1. Check Plan Quota
    const planDetails = await getOrganizationPlanDetails(organizationId);
    const maxListings = planDetails.plan.marketplaceListingsPerMonth; // 0 for Starter, 20 for Pro, 999999 for Enterprise

    if (maxListings === 0) {
      return NextResponse.json(
        {
          error:
            'La publication d\'annonces sur la marketplace pièces nécessite un abonnement Pro ou Enterprise. Sur le forfait Starter, vous avez un accès en consultation uniquement.',
        },
        { status: 403 }
      );
    }

    // Count listings created in the current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const countRows = await sql(
      `
      SELECT COUNT(*) as count 
      FROM marketplace_listings 
      WHERE organization_id = $1 AND created_at >= $2
    `,
      [organizationId, startOfMonth]
    );
    const currentMonthCount = parseInt(countRows[0]?.count || '0', 10);

    if (currentMonthCount >= maxListings) {
      return NextResponse.json(
        {
          error: `Vous avez atteint votre quota mensuel d'annonces (${currentMonthCount}/${maxListings}). Passez au forfait Enterprise pour des annonces illimitées.`,
        },
        { status: 403 }
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
      image_urls,
      part_id,
    } = body;

    if (!title || !category || !condition || !price || !location_wilaya) {
      return NextResponse.json(
        { error: 'Veuillez remplir les champs obligatoires (Titre, Catégorie, État, Prix, Wilaya).' },
        { status: 400 }
      );
    }

    const rows = await sql(
      `
      INSERT INTO marketplace_listings (
        organization_id, part_id, title, oem_number, category, condition,
        compatibility_makes, compatibility_models, compatibility_years,
        price, quantity, location_wilaya, description, image_urls, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active')
      RETURNING *
    `,
      [
        organizationId,
        part_id || null,
        title.trim(),
        oem_number?.trim() || null,
        category.trim(),
        condition,
        compatibility_makes?.trim() || null,
        compatibility_models?.trim() || null,
        compatibility_years?.trim() || null,
        parseFloat(price),
        parseInt(quantity, 10) || 1,
        location_wilaya.trim(),
        description?.trim() || null,
        JSON.stringify(image_urls || []),
      ]
    );

    const listing = rows[0];

    await logAudit({
      organizationId,
      userId,
      entityType: 'marketplace_listings',
      entityId: listing.id,
      action: 'create',
      metadata: { title: listing.title, oem_number: listing.oem_number, price: listing.price },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create marketplace listing:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
