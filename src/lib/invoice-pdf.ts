import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontSize: 10,
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 15,
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  companyDetails: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#475569',
    marginTop: 3,
    fontFamily: 'Courier',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailsBlock: {
    width: '48%',
  },
  detailsLabel: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  detailsValue: {
    fontSize: 10,
    color: '#1e293b',
    marginTop: 2,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colDesc: { width: '50%' },
  colSku: { width: '15%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '12.5%', textAlign: 'right' },
  colTotal: { width: '12.5%', textAlign: 'right' },
  totalsContainer: {
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalsLabel: {
    width: 100,
    textAlign: 'right',
    color: '#64748b',
  },
  totalsValue: {
    width: 80,
    textAlign: 'right',
    color: '#1e293b',
    fontFamily: 'Courier',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#3b82f6',
    fontWeight: 'bold',
  },
  grandTotalLabel: {
    width: 100,
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 12,
  },
  grandTotalValue: {
    width: 80,
    textAlign: 'right',
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Courier',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  }
});

interface InvoicePdfProps {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate: string;
  laborCost: number;
  parts: Array<{
    name: string;
    sku: string;
    quantity: number;
    unit_price_snapshot: number;
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export const InvoiceDocument = (props: InvoicePdfProps) => {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.companyName }, 'GARAGE PRO'),
          React.createElement(Text, { style: styles.companyDetails }, '12 Route de Chéraga, Algiers'),
          React.createElement(Text, { style: styles.companyDetails }, 'Phone: +213 21 00 00 00 | support@garagepro.dz')
        ),
        React.createElement(
          View,
          { style: styles.titleContainer },
          React.createElement(Text, { style: styles.invoiceTitle }, 'INVOICE'),
          React.createElement(Text, { style: styles.invoiceMeta }, `No: ${props.invoiceNumber}`),
          React.createElement(Text, { style: styles.invoiceMeta }, `Date: ${props.date}`)
        )
      ),

      // Customer and Vehicle Details Grid
      React.createElement(
        View,
        { style: styles.detailsGrid },
        React.createElement(
          View,
          { style: styles.detailsBlock },
          React.createElement(Text, { style: styles.detailsLabel }, 'Bill To:'),
          React.createElement(Text, { style: styles.detailsValue }, props.clientName),
          React.createElement(Text, { style: styles.detailsValue }, `Phone: ${props.clientPhone}`)
        ),
        React.createElement(
          View,
          { style: styles.detailsBlock },
          React.createElement(Text, { style: styles.detailsLabel }, 'Vehicle details:'),
          React.createElement(Text, { style: styles.detailsValue }, `${props.vehicleMake} ${props.vehicleModel}`),
          React.createElement(Text, { style: styles.detailsValue }, `Plate: ${props.vehiclePlate}`)
        )
      ),

      // Table of Items
      React.createElement(
        View,
        { style: styles.table },
        // Header
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: styles.colDesc }, 'Item Description'),
          React.createElement(Text, { style: styles.colSku }, 'SKU'),
          React.createElement(Text, { style: styles.colQty }, 'Qty'),
          React.createElement(Text, { style: styles.colPrice }, 'Unit Price'),
          React.createElement(Text, { style: styles.colTotal }, 'Total')
        ),
        // Labor
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colDesc }, 'Mechanical Work Labor (hourly/job rate)'),
          React.createElement(Text, { style: styles.colSku }, 'LAB-01'),
          React.createElement(Text, { style: styles.colQty }, '1'),
          React.createElement(Text, { style: styles.colPrice }, `$${props.laborCost.toFixed(2)}`),
          React.createElement(Text, { style: styles.colTotal }, `$${props.laborCost.toFixed(2)}`)
        ),
        // Parts
        props.parts.map((part, index) => {
          const totalPartPrice = part.quantity * part.unit_price_snapshot;
          return React.createElement(
            View,
            { key: index, style: styles.tableRow },
            React.createElement(Text, { style: styles.colDesc }, part.name),
            React.createElement(Text, { style: styles.colSku }, part.sku),
            React.createElement(Text, { style: styles.colQty }, part.quantity.toString()),
            React.createElement(Text, { style: styles.colPrice }, `$${part.unit_price_snapshot.toFixed(2)}`),
            React.createElement(Text, { style: styles.colTotal }, `$${totalPartPrice.toFixed(2)}`)
          );
        })
      ),

      // Totals
      React.createElement(
        View,
        { style: styles.totalsContainer },
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, 'Subtotal:'),
          React.createElement(Text, { style: styles.totalsValue }, `$${props.subtotal.toFixed(2)}`)
        ),
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, 'VAT (19%):'),
          React.createElement(Text, { style: styles.totalsValue }, `$${props.taxAmount.toFixed(2)}`)
        ),
        React.createElement(
          View,
          { style: styles.grandTotalRow },
          React.createElement(Text, { style: styles.grandTotalLabel }, 'Total Due:'),
          React.createElement(Text, { style: styles.grandTotalValue }, `$${props.total.toFixed(2)}`)
        )
      ),

      // Footer
      React.createElement(
        Text,
        { style: styles.footer },
        'Thank you for your business! Please settle within 30 days. For inquiries, email support@garagepro.dz'
      )
    )
  );
};
