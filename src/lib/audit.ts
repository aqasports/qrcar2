import { sql } from './db';

interface AuditLogParams {
  organizationId?: string | null;
  userId: string | null;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'link' | 'revoke' | 'transfer' | 'approve' | 'reject' | 'order' | 'status_change';
  metadata?: Record<string, any>;
}

export async function logAudit({
  organizationId,
  userId,
  entityType,
  entityId,
  action,
  metadata = {},
}: AuditLogParams) {
  try {
    await sql(
      `INSERT INTO audit_logs (organization_id, user_id, entity_type, entity_id, action, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        organizationId || null,
        userId,
        entityType,
        entityId,
        action,
        JSON.stringify(metadata),
      ]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
