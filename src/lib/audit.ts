import { sql } from './db';

interface AuditLogParams {
  userId: string | null;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'link' | 'revoke' | 'transfer';
  metadata?: Record<string, any>;
}

export async function logAudit({
  userId,
  entityType,
  entityId,
  action,
  metadata = {}
}: AuditLogParams) {
  try {
    await sql(
      `INSERT INTO audit_logs (user_id, entity_type, entity_id, action, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, entityType, entityId, action, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
