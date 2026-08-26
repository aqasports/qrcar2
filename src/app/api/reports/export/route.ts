import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { apiUnauthorized, apiForbidden } from '@/lib/api/response';

// Helper to escape values for CSV
function escapeCSV(val: any) {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // If value contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// GET /api/reports/export - Export database catalogs to CSV (tenant-scoped)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, organizationId } = session.user;
  if (role === 'technician') {
    return apiForbidden('Les techniciens ne peuvent pas exporter les données de l\'atelier.');
  }

  if (!organizationId) {
    return apiForbidden('Organisation non identifiée.');
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || '';

  try {
    let csvContent = '';
    let filename = 'export.csv';

    if (type === 'clients') {
      const rows = await sql(
        `SELECT * FROM clients WHERE organization_id = $1 ORDER BY full_name ASC`,
        [organizationId]
      );
      filename = 'clients-ledger.csv';
      
      const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Address', 'Notes', 'Created At'];
      csvContent += headers.join(',') + '\n';

      for (const r of rows) {
        const line = [
          r.id,
          escapeCSV(r.full_name),
          escapeCSV(r.phone),
          escapeCSV(r.email),
          escapeCSV(r.address),
          escapeCSV(r.notes),
          r.created_at
        ];
        csvContent += line.join(',') + '\n';
      }
    } else if (type === 'actions') {
      const rows = await sql(`
        SELECT a.*, v.plate_number, v.make, v.model, c.full_name as client_name
        FROM actions a
        JOIN vehicles v ON a.vehicle_id = v.id
        JOIN clients c ON v.client_id = c.id
        WHERE a.organization_id = $1
        ORDER BY a.date_in DESC
      `, [organizationId]);
      filename = 'service-actions-history.csv';

      const headers = ['Action ID', 'Client Name', 'Plate Number', 'Vehicle', 'Type', 'Description', 'Odometer Log', 'Status', 'Labor Cost', 'Date In', 'Date Out'];
      csvContent += headers.join(',') + '\n';

      for (const r of rows) {
        const line = [
          r.id,
          escapeCSV(r.client_name),
          escapeCSV(r.plate_number),
          escapeCSV(`${r.make} ${r.model}`),
          escapeCSV(r.type),
          escapeCSV(r.description),
          r.mileage_at_service,
          r.status,
          r.labor_cost,
          r.date_in,
          r.date_out || ''
        ];
        csvContent += line.join(',') + '\n';
      }
    } else if (type === 'inventory') {
      const rows = await sql(
        `SELECT * FROM parts WHERE organization_id = $1 ORDER BY name ASC`,
        [organizationId]
      );
      filename = 'inventory-catalog.csv';

      const headers = ['Part ID', 'Name', 'Category', 'SKU', 'Unit', 'Purchase Price', 'Sale Price', 'Qty in Stock', 'Min Threshold', 'Active'];
      csvContent += headers.join(',') + '\n';

      for (const r of rows) {
        const line = [
          r.id,
          escapeCSV(r.name),
          escapeCSV(r.category),
          escapeCSV(r.sku),
          escapeCSV(r.unit),
          r.purchase_price,
          r.sale_price,
          r.quantity_in_stock,
          r.min_stock_threshold,
          r.active ? 'YES' : 'NO'
        ];
        csvContent += line.join(',') + '\n';
      }
    } else {
      return new NextResponse('Invalid export type requested', { status: 400 });
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export CSV report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
