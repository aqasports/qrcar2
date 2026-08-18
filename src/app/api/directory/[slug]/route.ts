import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET /api/directory/[slug] - Single Garage Public Profile
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

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
        o.description,
        o.specialties,
        o.brands_serviced,
        o.opening_hours,
        o.wilaya,
        o.city,
        o.address,
        o.phone,
        o.email,
        o.gps_lat,
        o.gps_lng,
        o.is_verified_pro,
        o.created_at,
        p.name as plan_name,
        COALESCE(p.directory_tier, 'listed') as directory_tier
      FROM organizations o
      LEFT JOIN plans p ON o.plan_id = p.id
      WHERE o.slug = $1 AND o.is_directory_listed = true
      LIMIT 1
    `,
      [slug]
    );

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Garage non répertorié ou introuvable.' }, { status: 404 });
    }

    const org = orgRows[0];

    // Fetch authored mechanical solutions
    const solutions = await sql(
      `
      SELECT id, title, dtc_codes, make, model, engine_code, upvotes_count, created_at
      FROM mechanical_solutions
      WHERE organization_id = $1
      ORDER BY upvotes_count DESC, created_at DESC
      LIMIT 6
    `,
      [org.id]
    );

    // Fetch active marketplace parts
    const listings = await sql(
      `
      SELECT id, title, oem_number, category, condition, price, location_wilaya, created_at
      FROM marketplace_listings
      WHERE organization_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 6
    `,
      [org.id]
    );

    return NextResponse.json({
      organization: org,
      solutions,
      listings,
    });
  } catch (error: any) {
    console.error('Failed to get directory profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
