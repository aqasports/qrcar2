import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

// PATCH /api/marketplace/inquiries/[id] - Update inquiry status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: inquiryId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;

  try {
    const existing = await sql(
      `
      SELECT * FROM marketplace_inquiries 
      WHERE id = $1 AND (seller_organization_id = $2 OR buyer_organization_id = $2)
      LIMIT 1
    `,
      [inquiryId, organizationId]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Demande introuvable.' }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body; // 'read', 'replied', 'accepted', 'declined'

    const updatedRows = await sql(
      `
      UPDATE marketplace_inquiries
      SET status = COALESCE($1, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `,
      [status || null, inquiryId]
    );

    return NextResponse.json(updatedRows[0]);
  } catch (error: any) {
    console.error('Failed to update inquiry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
