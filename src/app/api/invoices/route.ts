import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getStore } from '@netlify/blobs';
import { InvoiceDocument } from '@/lib/invoice-pdf';

// GET /api/invoices - List invoices scoped to organization
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, organizationId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const invoices = await sql(
      `
      SELECT i.*, a.type as action_type, v.plate_number, c.full_name as client_name
      FROM invoices i
      JOIN actions a ON i.action_id = a.id AND a.organization_id = $1
      JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $1
      JOIN clients c ON v.client_id = c.id
      WHERE i.organization_id = $1
      ORDER BY i.created_at DESC
    `,
      [organizationId]
    );
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to get invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/invoices - Create/regenerate draft invoice for action scoped to organization
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId, organizationId, orgSlug, orgName } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action_id } = body;

    if (!action_id) {
      return NextResponse.json({ error: 'Missing action_id' }, { status: 400 });
    }

    // 1. Fetch action with vehicle and client details within organization
    const actionRows = await sql(
      `
      SELECT a.*, v.plate_number, v.make, v.model, c.full_name as client_name, c.phone as client_phone
      FROM actions a
      JOIN vehicles v ON a.vehicle_id = v.id AND v.organization_id = $2
      JOIN clients c ON v.client_id = c.id
      WHERE a.id = $1 AND a.organization_id = $2
      LIMIT 1
    `,
      [action_id, organizationId]
    );

    if (actionRows.length === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const action = actionRows[0];

    // 2. Fetch items (or legacy parts) attached to this action within organization
    let roItems = await sql(
      `
      SELECT roi.quantity, roi.unit_price, roi.name, roi.item_type
      FROM repair_order_items roi
      WHERE roi.action_id = $1
    `,
      [action_id]
    );

    let partsUsed: any[] = [];
    let itemsSum = 0;

    if (roItems.length > 0) {
      for (const item of roItems) {
        const lineTotal = parseFloat(String(item.quantity)) * parseFloat(String(item.unit_price));
        itemsSum += lineTotal;
        partsUsed.push({
          quantity: parseFloat(String(item.quantity)),
          unit_price_snapshot: parseFloat(String(item.unit_price)),
          name: item.name,
          sku: item.item_type === 'part' ? 'PIECE' : 'PRESTATION',
        });
      }
    } else {
      // Legacy fallback to action_parts
      partsUsed = await sql(
        `
        SELECT ap.quantity, ap.unit_price_snapshot, p.name, p.sku
        FROM action_parts ap
        JOIN parts p ON ap.part_id = p.id AND p.organization_id = $2
        WHERE ap.action_id = $1
      `,
        [action_id, organizationId]
      );
      for (const p of partsUsed) {
        itemsSum += p.quantity * parseFloat(p.unit_price_snapshot);
      }
    }

    // 3. Compute costs & Tax
    const labor = parseFloat(action.labor_cost) || 0.0;
    const subtotal = labor + itemsSum;

    const isTaxActive = action.has_tax !== false && action.has_tax !== 0;
    const taxRatePercent = isTaxActive ? (parseFloat(action.tax_rate) || 19.0) : 0.0;
    const taxAmount = subtotal * (taxRatePercent / 100);
    const total = subtotal + taxAmount;

    // 4. Check if invoice already exists
    const existingInvoiceRows = await sql(
      `SELECT * FROM invoices WHERE action_id = $1 AND organization_id = $2 LIMIT 1`,
      [action_id, organizationId]
    );

    let invoiceId = '';
    let invoiceNumber = '';
    let isRegen = false;

    if (existingInvoiceRows.length > 0) {
      const existing = existingInvoiceRows[0];
      if (existing.status === 'issued' || existing.status === 'paid') {
        return NextResponse.json(
          {
            error: 'invoice_frozen',
            message: 'This invoice is already issued/paid and frozen against updates.',
          },
          { status: 400 }
        );
      }

      // Reuse existing draft ID & number
      invoiceId = existing.id;
      invoiceNumber = existing.invoice_number;
      isRegen = true;
    }

    // Generate sequential number inside transaction per organization and year
    const currentYear = new Date().getFullYear();
    if (!isRegen) {
      const seqRows = await sql(
        `
        INSERT INTO invoice_sequences (organization_id, year, last_value)
        VALUES ($1, $2, 1)
        ON CONFLICT (organization_id, year) DO UPDATE
        SET last_value = invoice_sequences.last_value + 1
        RETURNING last_value
      `,
        [organizationId, currentYear]
      );

      const lastVal = seqRows[0].last_value;
      const cleanSlug = (orgSlug || 'GARAGE').toUpperCase().replace(/[^A-Z0-9]/g, '');
      invoiceNumber = `${cleanSlug}-${currentYear}-${lastVal.toString().padStart(6, '0')}`;
    }

    // Fetch organization branding
    const orgDetails = await sql(
      `
      SELECT o.name, o.logo_url, o.brand_color_primary, o.locale, o.currency, b.address, b.phone
      FROM organizations o
      LEFT JOIN branches b ON b.organization_id = o.id AND b.is_main = true
      WHERE o.id = $1 LIMIT 1
    `,
      [organizationId]
    );
    const org = orgDetails[0] || {};

    // Render invoice PDF to buffer using @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDocument, {
        invoiceNumber,
        date: new Date().toLocaleDateString(org.locale === 'ar' ? 'ar-DZ' : 'fr-FR'),
        clientName: action.client_name,
        clientPhone: action.client_phone,
        vehicleMake: action.make,
        vehicleModel: action.model,
        vehiclePlate: action.plate_number,
        laborCost: labor,
        parts: partsUsed.map((p) => ({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          unit_price_snapshot: parseFloat(p.unit_price_snapshot),
        })),
        subtotal,
        taxAmount,
        total,
        orgName: org.name || orgName,
        orgLogoUrl: org.logo_url || null,
        orgAddress: org.address || undefined,
        orgPhone: org.phone || undefined,
        brandColor: org.brand_color_primary || '#3b82f6',
        currency: org.currency || 'DZD',
        locale: (org.locale as any) || 'fr',
      }) as any
    );

    // Save to Netlify Blobs (Store 'invoices')
    const store = getStore({ name: 'invoices' });

    if (isRegen) {
      // Update existing database row
      await sql(
        `
        UPDATE invoices
        SET subtotal = $1,
            tax_amount = $2,
            total = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND organization_id = $5
      `,
        [subtotal, taxAmount, total, invoiceId, organizationId]
      );

      // Overwrite blob
      await store.set(invoiceId, pdfBuffer as any, {
        metadata: { contentType: 'application/pdf', invoiceNumber, organizationId },
      });
    } else {
      // Insert new database row with organization_id
      const newInvoiceRows = await sql(
        `
        INSERT INTO invoices (organization_id, action_id, invoice_number, subtotal, tax_amount, total, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'draft')
        RETURNING id
      `,
        [organizationId, action_id, invoiceNumber, subtotal, taxAmount, total]
      );

      invoiceId = newInvoiceRows[0].id;

      // Save blob
      await store.set(invoiceId, pdfBuffer as any, {
        metadata: { contentType: 'application/pdf', invoiceNumber, organizationId },
      });

      // Update action status to invoiced
      await sql(
        `UPDATE actions SET status = 'invoiced' WHERE id = $1 AND organization_id = $2`,
        [action_id, organizationId]
      );
    }

    // Log audit
    await logAudit({
      organizationId,
      userId,
      entityType: 'invoices',
      entityId: invoiceId,
      action: isRegen ? 'update' : 'create',
      metadata: { invoice_number: invoiceNumber, total, is_regen: isRegen },
    });

    return NextResponse.json(
      {
        message: isRegen ? 'Invoice regenerated successfully' : 'Invoice created successfully',
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        total,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to generate invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
