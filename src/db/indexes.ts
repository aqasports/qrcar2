import { index } from 'drizzle-orm/pg-core';
import {
  actions,
  vehicles,
  clients,
  parts,
  pvcCards,
  auditLogs,
  marketplaceListings,
  stockMovements,
  invoices,
} from './schema';

/**
 * Composite PostgreSQL performance indexes for high-throughput automotive telemetry queries
 */
export const performanceIndexes = {
  // Actions by org, status, and entry date (for dashboard pipelines)
  actionsOrgStatusDate: index('idx_actions_org_status_date').on(
    actions.organizationId,
    actions.status,
    actions.dateIn
  ),

  // Vehicle lookup by org and plate number
  vehiclesOrgPlate: index('idx_vehicles_org_plate').on(
    vehicles.organizationId,
    vehicles.plateNumber
  ),

  // Client lookup by org and phone/name
  clientsOrgPhone: index('idx_clients_org_phone').on(
    clients.organizationId,
    clients.phone
  ),

  // Parts inventory alerts by stock and threshold
  partsOrgStockThreshold: index('idx_parts_org_stock_threshold').on(
    parts.organizationId,
    parts.quantityInStock,
    parts.minStockThreshold
  ),

  // PVC Card inventory status lookup
  pvcCardsOrgStatus: index('idx_pvc_cards_org_status').on(
    pvcCards.organizationId,
    pvcCards.status
  ),

  // Invoices by org and payment status
  invoicesOrgStatus: index('idx_invoices_org_status').on(
    invoices.organizationId,
    invoices.status
  ),

  // Audit log chronological pagination
  auditLogsOrgCreatedAt: index('idx_audit_logs_org_created_at').on(
    auditLogs.organizationId,
    auditLogs.createdAt
  ),

  // Marketplace filter by status and category
  marketplaceStatusCategory: index('idx_marketplace_status_category').on(
    marketplaceListings.status,
    marketplaceListings.category
  ),

  // Stock movements ledger lookup by part and date
  stockMovementsPartDate: index('idx_stock_movements_part_date').on(
    stockMovements.partId,
    stockMovements.createdAt
  ),
};
