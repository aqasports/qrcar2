import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/organization/directory-profile - Get active garage profile
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    const rows = await sql(
      `
      SELECT 
        id, name, slug, logo_url, description, specialties,
        brands_serviced, opening_hours, wilaya, city, address,
        phone, email, gps_lat, gps_lng, is_directory_listed
      FROM organizations 
      WHERE id = $1 
      LIMIT 1
    `,
      [organizationId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    console.error('Failed to get directory profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/organization/directory-profile - Update active garage profile
export async function PATCH(req: NextRequest) {
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
      description,
      specialties,
      brands_serviced,
      opening_hours,
      wilaya,
      city,
      address,
      phone,
      email,
      gps_lat,
      gps_lng,
      is_directory_listed,
    } = body;

    const updatedRows = await sql(
      `
      UPDATE organizations
      SET description = COALESCE($1, description),
          specialties = COALESCE($2, specialties),
          brands_serviced = COALESCE($3, brands_serviced),
          opening_hours = COALESCE($4, opening_hours),
          wilaya = COALESCE($5, wilaya),
          city = COALESCE($6, city),
          address = COALESCE($7, address),
          phone = COALESCE($8, phone),
          email = COALESCE($9, email),
          gps_lat = COALESCE($10, gps_lat),
          gps_lng = COALESCE($11, gps_lng),
          is_directory_listed = COALESCE($12, is_directory_listed),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `,
      [
        description !== undefined ? description : null,
        specialties !== undefined ? JSON.stringify(specialties) : null,
        brands_serviced !== undefined ? JSON.stringify(brands_serviced) : null,
        opening_hours !== undefined ? JSON.stringify(opening_hours) : null,
        wilaya || null,
        city || null,
        address || null,
        phone || null,
        email || null,
        gps_lat !== undefined ? gps_lat : null,
        gps_lng !== undefined ? gps_lng : null,
        is_directory_listed !== undefined ? is_directory_listed : null,
        organizationId,
      ]
    );

    await logAudit({
      organizationId,
      userId,
      entityType: 'organizations',
      entityId: organizationId,
      action: 'update',
      metadata: { action_type: 'update_directory_profile' },
    });

    return NextResponse.json(updatedRows[0]);
  } catch (error: any) {
    console.error('Failed to update directory profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
