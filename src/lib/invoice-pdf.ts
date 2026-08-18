import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';

export interface InvoicePdfProps {
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
  // Organization Branding & i18n
  orgName?: string;
  orgLogoUrl?: string | null;
  orgAddress?: string;
  orgPhone?: string;
  brandColor?: string;
  currency?: string;
  locale?: 'fr' | 'ar' | 'en';
}

const INVOICE_I18N = {
  fr: {
    invoice: 'FACTURE',
    billTo: 'Facturé à :',
    vehicleDetails: 'Véhicule :',
    plate: 'Immatriculation :',
    phone: 'Tél :',
    itemDesc: 'Désignation',
    sku: 'Réf / SKU',
    qty: 'Qté',
    unitPrice: 'Prix Unit.',
    total: 'Total',
    labor: 'Main d’œuvre mécanique & diagnostic',
    subtotal: 'Sous-total HT :',
    tax: 'TVA (19%) :',
    totalDue: 'Total TTC :',
    thankYou: 'Merci pour votre confiance. Règlement sous 30 jours.',
  },
  ar: {
    invoice: 'فاتورة رسمية',
    billTo: 'إلى السيد(ة) :',
    vehicleDetails: 'بيانات المركبة :',
    plate: 'رقم التسجيل :',
    phone: 'الهاتف :',
    itemDesc: 'البيان / الخدمة',
    sku: 'الرمز',
    qty: 'الكمية',
    unitPrice: 'سعر الوحدة',
    total: 'المجموع',
    labor: 'أتعاب اليد العاملة والفحص التقني',
    subtotal: 'المجموع بدون رسوم :',
    tax: 'الرسم على القيمة المضافة (19%) :',
    totalDue: 'المبلغ الإجمالي المستحق :',
    thankYou: 'شكراً لتعاملكم معنا. الدفع عند الاستلام أو خلال 30 يوماً.',
  },
  en: {
    invoice: 'INVOICE',
    billTo: 'Bill To:',
    vehicleDetails: 'Vehicle Details:',
    plate: 'Plate Number:',
    phone: 'Phone:',
    itemDesc: 'Item Description',
    sku: 'SKU',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    labor: 'Mechanical Work Labor & Diagnostic',
    subtotal: 'Subtotal:',
    tax: 'VAT (19%):',
    totalDue: 'Total Due:',
    thankYou: 'Thank you for your business. Payment due within 30 days.',
  },
};

export const InvoiceDocument = (props: InvoicePdfProps) => {
  const locale = props.locale || 'fr';
  const i18n = INVOICE_I18N[locale] || INVOICE_I18N.fr;
  const isRtl = locale === 'ar';
  const brandColor = props.brandColor || '#3b82f6';
  const currency = props.currency || 'DZD';

  const styles = StyleSheet.create({
    page: {
      padding: 35,
      backgroundColor: '#ffffff',
      fontSize: 9,
      color: '#334155',
    },
    header: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 2,
      borderBottomColor: brandColor,
      paddingBottom: 12,
      marginBottom: 16,
    },
    logoSection: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoImage: {
      width: 40,
      height: 40,
      objectFit: 'contain',
    },
    companyName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1e293b',
      textAlign: isRtl ? 'right' : 'left',
    },
    companyDetails: {
      fontSize: 8,
      color: '#64748b',
      marginTop: 2,
      textAlign: isRtl ? 'right' : 'left',
    },
    titleContainer: {
      alignItems: isRtl ? 'flex-start' : 'flex-end',
    },
    invoiceTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: brandColor,
      textAlign: isRtl ? 'left' : 'right',
    },
    invoiceMeta: {
      fontSize: 8.5,
      color: '#475569',
      marginTop: 2,
      fontFamily: 'Courier',
      textAlign: isRtl ? 'left' : 'right',
    },
    detailsGrid: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
      backgroundColor: '#f8fafc',
      padding: 10,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    detailsBlock: {
      width: '48%',
    },
    detailsLabel: {
      fontSize: 7.5,
      color: '#64748b',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textAlign: isRtl ? 'right' : 'left',
    },
    detailsValue: {
      fontSize: 9,
      color: '#1e293b',
      marginTop: 2,
      textAlign: isRtl ? 'right' : 'left',
    },
    table: {
      marginTop: 8,
      marginBottom: 16,
    },
    tableHeader: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      backgroundColor: '#f1f5f9',
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
      paddingVertical: 5,
      paddingHorizontal: 8,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      paddingVertical: 5,
      paddingHorizontal: 8,
    },
    colDesc: { width: '48%', textAlign: isRtl ? 'right' : 'left' },
    colSku: { width: '16%', textAlign: 'center' },
    colQty: { width: '10%', textAlign: 'center' },
    colPrice: { width: '13%', textAlign: 'right' },
    colTotal: { width: '13%', textAlign: 'right' },
    totalsContainer: {
      alignItems: isRtl ? 'flex-start' : 'flex-end',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
    },
    totalsRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: isRtl ? 'flex-start' : 'flex-end',
      marginBottom: 3,
    },
    totalsLabel: {
      width: 140,
      textAlign: isRtl ? 'left' : 'right',
      color: '#64748b',
    },
    totalsValue: {
      width: 90,
      textAlign: 'right',
      color: '#1e293b',
      fontFamily: 'Courier',
    },
    grandTotalRow: {
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: isRtl ? 'flex-start' : 'flex-end',
      marginTop: 5,
      paddingTop: 5,
      borderTopWidth: 1.5,
      borderTopColor: brandColor,
      fontWeight: 'bold',
    },
    grandTotalLabel: {
      width: 140,
      textAlign: isRtl ? 'left' : 'right',
      color: '#1e293b',
      fontSize: 11,
    },
    grandTotalValue: {
      width: 90,
      textAlign: 'right',
      color: brandColor,
      fontSize: 11,
      fontWeight: 'bold',
      fontFamily: 'Courier',
    },
    footer: {
      position: 'absolute',
      bottom: 25,
      left: 35,
      right: 35,
      textAlign: 'center',
      fontSize: 7.5,
      color: '#94a3b8',
      borderTopWidth: 1,
      borderTopColor: '#f1f5f9',
      paddingTop: 8,
    },
  });

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
          { style: styles.logoSection },
          props.orgLogoUrl
            ? React.createElement(Image, { src: props.orgLogoUrl, style: styles.logoImage })
            : null,
          React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.companyName }, props.orgName || 'GARAGE PRO'),
            React.createElement(Text, { style: styles.companyDetails }, props.orgAddress || 'Atelier Mécanique & Diagnostic'),
            React.createElement(
              Text,
              { style: styles.companyDetails },
              props.orgPhone ? `${i18n.phone} ${props.orgPhone}` : 'Contact Support Atelier'
            )
          )
        ),
        React.createElement(
          View,
          { style: styles.titleContainer },
          React.createElement(Text, { style: styles.invoiceTitle }, i18n.invoice),
          React.createElement(Text, { style: styles.invoiceMeta }, `No: ${props.invoiceNumber}`),
          React.createElement(Text, { style: styles.invoiceMeta }, `${props.date}`)
        )
      ),

      // Customer and Vehicle Details Grid
      React.createElement(
        View,
        { style: styles.detailsGrid },
        React.createElement(
          View,
          { style: styles.detailsBlock },
          React.createElement(Text, { style: styles.detailsLabel }, i18n.billTo),
          React.createElement(Text, { style: styles.detailsValue }, props.clientName),
          React.createElement(Text, { style: styles.detailsValue }, `${i18n.phone} ${props.clientPhone}`)
        ),
        React.createElement(
          View,
          { style: styles.detailsBlock },
          React.createElement(Text, { style: styles.detailsLabel }, i18n.vehicleDetails),
          React.createElement(Text, { style: styles.detailsValue }, `${props.vehicleMake} ${props.vehicleModel}`),
          React.createElement(Text, { style: styles.detailsValue }, `${i18n.plate} ${props.vehiclePlate}`)
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
          React.createElement(Text, { style: styles.colDesc }, i18n.itemDesc),
          React.createElement(Text, { style: styles.colSku }, i18n.sku),
          React.createElement(Text, { style: styles.colQty }, i18n.qty),
          React.createElement(Text, { style: styles.colPrice }, `${i18n.unitPrice} (${currency})`),
          React.createElement(Text, { style: styles.colTotal }, `${i18n.total} (${currency})`)
        ),
        // Labor
        React.createElement(
          View,
          { style: styles.tableRow },
          React.createElement(Text, { style: styles.colDesc }, i18n.labor),
          React.createElement(Text, { style: styles.colSku }, 'MO-01'),
          React.createElement(Text, { style: styles.colQty }, '1'),
          React.createElement(Text, { style: styles.colPrice }, props.laborCost.toFixed(2)),
          React.createElement(Text, { style: styles.colTotal }, props.laborCost.toFixed(2))
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
            React.createElement(Text, { style: styles.colPrice }, part.unit_price_snapshot.toFixed(2)),
            React.createElement(Text, { style: styles.colTotal }, totalPartPrice.toFixed(2))
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
          React.createElement(Text, { style: styles.totalsLabel }, i18n.subtotal),
          React.createElement(Text, { style: styles.totalsValue }, `${props.subtotal.toFixed(2)} ${currency}`)
        ),
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, i18n.tax),
          React.createElement(Text, { style: styles.totalsValue }, `${props.taxAmount.toFixed(2)} ${currency}`)
        ),
        React.createElement(
          View,
          { style: styles.grandTotalRow },
          React.createElement(Text, { style: styles.grandTotalLabel }, i18n.totalDue),
          React.createElement(Text, { style: styles.grandTotalValue }, `${props.total.toFixed(2)} ${currency}`)
        )
      ),

      // Footer
      React.createElement(
        Text,
        { style: styles.footer },
        `${props.orgName || 'Garage Pro'} — ${i18n.thankYou}`
      )
    )
  );
};
