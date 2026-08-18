import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/directory - Public Directory Search with Tier-Boosting & Rate Limiting
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  // Rate limit: 100 requests per minute per IP for public directory
  const rl = checkRateLimit(`public_dir_${ip}`, 100, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer dans quelques instants.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get('search')?.trim() || '';
  const wilaya = searchParams.get('wilaya')?.trim() || '';
  const specialty = searchParams.get('specialty')?.trim() || '';
  const brand = searchParams.get('brand')?.trim() || '';

  try {
    let whereConditions = [
      `o.is_directory_listed = true`,
      `o.subscription_status IN ('active', 'trialing')`,
    ];
    let queryParams: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereConditions.push(
        `(o.name ILIKE $${paramIdx} OR o.description ILIKE $${paramIdx} OR o.city ILIKE $${paramIdx} OR o.specialties::text ILIKE $${paramIdx} OR o.brands_serviced::text ILIKE $${paramIdx})`
      );
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    if (wilaya && wilaya !== 'all') {
      whereConditions.push(`o.wilaya ILIKE $${paramIdx++}`);
      queryParams.push(`%${wilaya}%`);
    }

    if (specialty && specialty !== 'all') {
      whereConditions.push(`o.specialties::text ILIKE $${paramIdx++}`);
      queryParams.push(`%${specialty}%`);
    }

    if (brand && brand !== 'all') {
      whereConditions.push(`o.brands_serviced::text ILIKE $${paramIdx++}`);
      queryParams.push(`%${brand}%`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const query = `
      SELECT 
        o.id,
        o.name,
        o.slug,
        o.logo_url,
        o.brand_color_primary,
        o.description,
        o.specialties,
        o.brands_serviced,
        o.wilaya,
        o.city,
        o.address,
        o.phone,
        o.email,
        o.gps_lat,
        o.gps_lng,
        o.is_verified_pro,
        p.name as plan_name,
        COALESCE(p.directory_tier, 'listed') as directory_tier,
        (SELECT COUNT(*) FROM mechanical_solutions ms WHERE ms.organization_id = o.id) as solutions_count,
        (SELECT COUNT(*) FROM marketplace_listings ml WHERE ml.organization_id = o.id AND ml.status = 'active') as active_listings_count
      FROM organizations o
      LEFT JOIN plans p ON o.plan_id = p.id
      ${whereClause}
      ORDER BY 
        CASE 
          WHEN p.directory_tier = 'spotlight' THEN 1
          WHEN p.directory_tier = 'featured' THEN 2
          ELSE 3
        END,
        solutions_count DESC,
        o.created_at ASC
    `;

    const directory = await sql(query, queryParams);

    return NextResponse.json(directory);
  } catch (error: any) {
    console.error('Failed to get public directory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
