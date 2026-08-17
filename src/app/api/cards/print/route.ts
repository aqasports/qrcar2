import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';
import QRCode from 'qrcode';
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

// Define styles for PDF sheet
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e293b',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '30%', // 3 columns
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 6,
  },
  qrCode: {
    width: 110,
    height: 110,
  },
  serialLabel: {
    fontSize: 10,
    fontFamily: 'Courier',
    marginTop: 6,
    fontWeight: 'bold',
    color: '#475569',
  },
  publicUrl: {
    fontSize: 6,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  }
});

// React PDF Document Component without JSX
interface CardData {
  serial_label: string;
  qrDataUrl: string;
  token: string;
}

const QRSheetsDocument = ({ cards, baseUrl }: { cards: CardData[]; baseUrl: string }) => {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.title }, 'PVC Card QR Code Print Sheet'),
      React.createElement(
        View,
        { style: styles.grid },
        cards.map((card) =>
          React.createElement(
            View,
            { key: card.serial_label, style: styles.card },
            React.createElement(Text, { style: styles.logoText }, 'GARAGE PRO HISTORY'),
            React.createElement(Image, { src: card.qrDataUrl, style: styles.qrCode }),
            React.createElement(Text, { style: styles.serialLabel }, card.serial_label),
            React.createElement(
              Text,
              { style: styles.publicUrl },
              `${baseUrl.replace('https://', '').replace('http://', '')}/v/${card.token.substring(0, 8)}...`
            )
          )
        )
      )
    )
  );
};

// GET /api/cards/print - Render A4 PDF sheet of QR codes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { role } = session.user;
  if (role === 'technician') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const serialsParam = searchParams.get('serials') || '';

  try {
    let cards = [];
    if (serialsParam) {
      const serialList = serialsParam.split(',').map(s => s.trim());
      const placeholders = serialList.map((_, i) => `$${i + 1}`).join(', ');
      cards = await sql(`
        SELECT token, serial_label 
        FROM pvc_cards 
        WHERE serial_label IN (${placeholders})
        ORDER BY serial_label ASC
      `, serialList);
    } else {
      // Default: fetch all unassigned cards
      cards = await sql(`
        SELECT token, serial_label 
        FROM pvc_cards 
        WHERE status = 'unassigned'
        ORDER BY serial_label ASC
        LIMIT 24
      `);
    }

    if (cards.length === 0) {
      return new NextResponse('No cards found to print', { status: 404 });
    }

    // Load PUBLIC_BASE_URL env var
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://garage-pro.netlify.app';

    // Generate QR code data URLs
    const cardsWithQr: CardData[] = await Promise.all(
      cards.map(async (card) => {
        const qrUrl = `${baseUrl}/v/${card.token}`;
        const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 250 });
        return {
          serial_label: card.serial_label,
          token: card.token,
          qrDataUrl
        };
      })
    );

    // Render PDF Document to Buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(QRSheetsDocument, { cards: cardsWithQr, baseUrl }) as any
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="pvc-qr-sheet.pdf"',
      },
    });
  } catch (error) {
    console.error('Failed to generate PDF QR sheet:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
