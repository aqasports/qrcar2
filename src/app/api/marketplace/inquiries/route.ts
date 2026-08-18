import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// GET /api/marketplace/inquiries - List inquiries received & sent
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // 'received' | 'sent' | 'all'

  try {
    let whereClause = `WHERE (mi.seller_organization_id = $1 OR mi.buyer_organization_id = $1)`;
    if (type === 'received') {
      whereClause = `WHERE mi.seller_organization_id = $1`;
    } else if (type === 'sent') {
      whereClause = `WHERE mi.buyer_organization_id = $1`;
    }

    const inquiries = await sql(
      `
      SELECT 
        mi.*,
        ml.title as listing_title,
        ml.oem_number,
        ml.price as listing_price,
        ml.location_wilaya,
        buyer_org.name as buyer_garage_name,
        buyer_org.slug as buyer_slug,
        seller_org.name as seller_garage_name,
        seller_org.slug as seller_slug,
        u.name as sender_name
      FROM marketplace_inquiries mi
      JOIN marketplace_listings ml ON mi.listing_id = ml.id
      JOIN organizations buyer_org ON mi.buyer_organization_id = buyer_org.id
      JOIN organizations seller_org ON mi.seller_organization_id = seller_org.id
      JOIN users u ON mi.sender_user_id = u.id
      ${whereClause}
      ORDER BY mi.created_at DESC
    `,
      [organizationId]
    );

    return NextResponse.json(inquiries);
  } catch (error: any) {
    console.error('Failed to get inquiries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/marketplace/inquiries - Send inquiry to seller
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: userId, organizationId } = session.user;

  try {
    const body = await req.json();
    const { listing_id, message, proposed_price, buyer_phone } = body;

    if (!listing_id || !message) {
      return NextResponse.json({ error: 'Le message et l\'identifiant d\'annonce sont requis.' }, { status: 400 });
    }

    // Find listing and seller organization
    const listingRows = await sql(`SELECT * FROM marketplace_listings WHERE id = $1 LIMIT 1`, [listing_id]);
    if (listingRows.length === 0) {
      return NextResponse.json({ error: 'Annonce introuvable.' }, { status: 404 });
    }

    const listing = listingRows[0];
    if (listing.organization_id === organizationId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas envoyer une demande pour votre propre annonce.' },
        { status: 400 }
      );
    }

    const rows = await sql(
      `
      INSERT INTO marketplace_inquiries (
        listing_id, buyer_organization_id, seller_organization_id,
        sender_user_id, message, proposed_price, buyer_phone, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'unread')
      RETURNING *
    `,
      [
        listing_id,
        organizationId,
        listing.organization_id,
        userId,
        message.trim(),
        proposed_price ? parseFloat(proposed_price) : null,
        buyer_phone?.trim() || null,
      ]
    );

    const inquiry = rows[0];

    await logAudit({
      organizationId,
      userId,
      entityType: 'marketplace_inquiries',
      entityId: inquiry.id,
      action: 'create',
      metadata: { listing_id, seller_org_id: listing.organization_id },
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create inquiry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
