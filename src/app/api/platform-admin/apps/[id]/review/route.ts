import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isPlatformAdmin = Boolean(session?.user?.isPlatformAdmin || session?.user?.role === 'platform_admin');
    if (!isPlatformAdmin || !session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Platform Admin only' }, { status: 403 });
    }

    const reviewerId = session.user.id;
    const body = await req.json();
    const { decision, rejectionReason } = body; // decision: 'approve', 'reject', 'suspend'

    if (!['approve', 'reject', 'suspend'].includes(decision)) {
      return NextResponse.json({ success: false, error: 'Invalid decision. Must be approve, reject, or suspend.' }, { status: 400 });
    }

    if (decision === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json({ success: false, error: 'Rejection reason is mandatory when rejecting an application.' }, { status: 400 });
    }

    let nextStatus = 'published';
    if (decision === 'reject') nextStatus = 'rejected';
    else if (decision === 'suspend') nextStatus = 'suspended';

    // 1. Update app status
    const updateRows = await sql(
      `UPDATE apps 
       SET status = $1,
           rejection_reason = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [nextStatus, decision === 'reject' ? rejectionReason.trim() : null, reviewerId, id]
    );

    if (updateRows.length === 0) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const updatedApp = updateRows[0];

    // 2. If suspended, immediately revoke active API keys and disable webhook subscriptions across all installs
    if (decision === 'suspend') {
      await sql(
        `UPDATE api_keys 
         SET revoked_at = NOW() 
         WHERE app_install_id IN (SELECT id FROM app_installs WHERE app_id = $1)
           AND revoked_at IS NULL`,
        [id]
      );

      await sql(
        `UPDATE webhook_subscriptions 
         SET active = false, updated_at = NOW() 
         WHERE app_install_id IN (SELECT id FROM app_installs WHERE app_id = $1)`,
        [id]
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedApp,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
