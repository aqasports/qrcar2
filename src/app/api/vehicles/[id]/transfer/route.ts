import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// POST /api/vehicles/[id]/transfer - Transfer vehicle ownership or detach scoped to organization
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
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
    const { new_client_id, detach_pending_sale, reason } = body;

    // Check vehicle exists in this organization
    const vehicleCheck = await sql(
      `SELECT * FROM vehicles WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [vehicleId, organizationId]
    );
    if (vehicleCheck.length === 0) {
      return NextResponse.json({ error: 'Véhicule introuvable' }, { status: 404 });
    }
    const vehicle = vehicleCheck[0];
    const oldClientId = vehicle.client_id;

    // Case A: Detach owner pending sale / new owner
    if (detach_pending_sale || new_client_id === null || new_client_id === 'detach') {
      const updatedRows = await sql(
        `
        UPDATE vehicles
        SET client_id = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND organization_id = $2
        RETURNING *
      `,
        [vehicleId, organizationId]
      );

      const updatedVehicle = updatedRows[0];

      await logAudit({
        organizationId,
        userId,
        entityType: 'vehicles',
        entityId: vehicleId,
        action: 'transfer',
        metadata: {
          action_type: 'detach_pending_new_owner',
          old_client_id: oldClientId,
          reason: reason || 'Véhicule vendu / en attente de cession',
          plate_number: vehicle.plate_number,
        },
      });

      return NextResponse.json(updatedVehicle);
    }

    // Case B: Assign or Transfer to a new registered client in the same organization
    if (!new_client_id) {
      return NextResponse.json({ error: 'Veuillez sélectionner un nouveau propriétaire' }, { status: 400 });
    }

    if (oldClientId === new_client_id) {
      return NextResponse.json({ error: 'Ce véhicule appartient déjà à ce client' }, { status: 400 });
    }

    // Verify new client exists in the same organization
    const clientCheck = await sql(
      `SELECT id, full_name, phone FROM clients WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [new_client_id, organizationId]
    );
    if (clientCheck.length === 0) {
      return NextResponse.json({ error: 'Le nouveau client sélectionné est introuvable' }, { status: 400 });
    }

    const newClient = clientCheck[0];

    // Perform ownership transfer in-place
    const updatedRows = await sql(
      `
      UPDATE vehicles
      SET client_id = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND organization_id = $3
      RETURNING *
    `,
      [new_client_id, vehicleId, organizationId]
    );

    const updatedVehicle = updatedRows[0];

    // Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'vehicles',
      entityId: vehicleId,
      action: 'transfer',
      metadata: {
        action_type: oldClientId ? 'ownership_transfer' : 'owner_assigned',
        old_client_id: oldClientId || null,
        new_client_id: new_client_id,
        new_client_name: newClient.full_name,
        plate_number: vehicle.plate_number,
        reason: reason || 'Changement de propriétaire',
      },
    });

    return NextResponse.json(updatedVehicle);
  } catch (error) {
    console.error('Failed to transfer vehicle ownership:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
