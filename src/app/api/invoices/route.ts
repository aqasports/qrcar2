import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getStore } from '@netlify/blobs';
import { InvoiceDocument } from '@/lib/invoice-pdf';

// GET /api/invoices - List invoices
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const invoices = await sql(`
      SELECT i.*, a.type as action_type, v.plate_number, c.full_name as client_name
      FROM invoices i
      JOIN actions a ON i.action_id = a.id
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN clients c ON v.client_id = c.id
      ORDER BY i.created_at DESC
    `);
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to get invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/invoices - Create/regenerate draft invoice for action
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { role, id: userId } = session.user;
  if (role === 'technician') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action_id } = body;

    if (!action_id) {
      return NextResponse.json({ error: 'Missing action_id' }, { status: 400 });
    }

    // 1. Fetch action with vehicle and client details
    const actionRows = await sql(`
      SELECT a.*, v.plate_number, v.make, v.model, c.full_name as client_name, c.phone as client_phone
      FROM actions a
      JOIN vehicles v ON a.vehicle_id = v.id
      JOIN clients c ON v.client_id = c.id
      WHERE a.id = $1
      LIMIT 1
    `, [action_id]);

    if (actionRows.length === 0) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const action = actionRows[0];

    // 2. Fetch parts attached to this action
    const partsUsed = await sql(`
      SELECT ap.quantity, ap.unit_price_snapshot, p.name, p.sku
      FROM action_parts ap
      JOIN parts p ON ap.part_id = p.id
      WHERE ap.action_id = $1
    `, [action_id]);

    // 3. Compute costs
    const labor = parseFloat(action.labor_cost) || 0.00;
    let partsSum = 0;
    for (const p of partsUsed) {
      partsSum += p.quantity * parseFloat(p.unit_price_snapshot);
    }

    const subtotal = labor + partsSum;
    const taxAmount = subtotal * 0.19; // 19% standard VAT
    const total = subtotal + taxAmount;

    // 4. Check if invoice already exists
    const existingInvoiceRows = await sql(`SELECT * FROM invoices WHERE action_id = $1 LIMIT 1`, [action_id]);
    
    let invoiceId = '';
    let invoiceNumber = '';
    let isRegen = false;

    if (existingInvoiceRows.length > 0) {
      const existing = existingInvoiceRows[0];
      if (existing.status === 'issued' || existing.status === 'paid') {
        return NextResponse.json({
          error: 'invoice_frozen',
          message: 'This invoice is already issued/paid and frozen against updates.'
        }, { status: 400 });
      }

      // Reuse existing draft ID & number
      invoiceId = existing.id;
      invoiceNumber = existing.invoice_number;
      isRegen = true;
    }

    // Generate sequential number inside transaction if new
    const currentYear = new Date().getFullYear();
    if (!isRegen) {
      // Row lock sequence increment
      const seqRows = await sql(`
        INSERT INTO invoice_sequences (year, last_value)
        VALUES ($1, 1)
        ON CONFLICT (year) DO UPDATE
        SET last_value = invoice_sequences.last_value + 1
        RETURNING last_value
      `, [currentYear]);
      
      const lastVal = seqRows[0].last_value;
      invoiceNumber = `${currentYear}-${lastVal.toString().padStart(6, '0')}`;
    }

    // Render invoice PDF to buffer using @react-pdf/renderer
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoiceDocument, {
        invoiceNumber,
        date: new Date().toLocaleDateString(),
        clientName: action.client_name,
        clientPhone: action.client_phone,
        vehicleMake: action.make,
        vehicleModel: action.model,
        vehiclePlate: action.plate_number,
        laborCost: labor,
        parts: partsUsed.map(p => ({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          unit_price_snapshot: parseFloat(p.unit_price_snapshot)
        })),
        subtotal,
        taxAmount,
        total
      }) as any
    );

    // Save to Netlify Blobs (Site-scoped store 'invoices')
    const store = getStore({ name: 'invoices' });
    
    if (isRegen) {
      // Update existing database row
      await sql(`
        UPDATE invoices
        SET subtotal = $1,
            tax_amount = $2,
            total = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [subtotal, taxAmount, total, invoiceId]);
      
      // Overwrite blob
      await store.set(invoiceId, pdfBuffer as any, {
        metadata: { contentType: 'application/pdf', invoiceNumber }
      });
    } else {
      // Insert new database row
      const newInvoiceRows = await sql(`
        INSERT INTO invoices (action_id, invoice_number, subtotal, tax_amount, total, status)
        VALUES ($1, $2, $3, $4, $5, 'draft')
        RETURNING id
      `, [action_id, invoiceNumber, subtotal, taxAmount, total]);
      
      invoiceId = newInvoiceRows[0].id;

      // Save blob
      await store.set(invoiceId, pdfBuffer as any, {
        metadata: { contentType: 'application/pdf', invoiceNumber }
      });

      // Update action status to invoiced
      await sql(`UPDATE actions SET status = 'invoiced' WHERE id = $1`, [action_id]);
    }

    // Log audit
    await logAudit({
      userId,
      entityType: 'invoices',
      entityId: invoiceId,
      action: isRegen ? 'update' : 'create',
      metadata: { invoice_number: invoiceNumber, total, is_regen: isRegen }
    });

    return NextResponse.json({
      message: isRegen ? 'Invoice regenerated successfully' : 'Invoice created successfully',
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      total
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to generate invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
