import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET /api/public/calendar/[token]?type=service|inspection - Generates an .ics file for calendar export
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const searchParams = req.nextUrl.searchParams;
  const reminderType = searchParams.get('type') || 'service';

  try {
    // 1. Fetch vehicle via active card token
    const cardRows = await sql(`SELECT * FROM pvc_cards WHERE token = $1 LIMIT 1`, [token]);
    if (cardRows.length === 0 || cardRows[0].status !== 'active' || !cardRows[0].vehicle_id) {
      return new NextResponse('Invalid or inactive card token', { status: 403 });
    }

    const vehicleRows = await sql(`
      SELECT v.*, c.full_name as client_name
      FROM vehicles v
      JOIN clients c ON v.client_id = c.id
      WHERE v.id = $1
      LIMIT 1
    `, [cardRows[0].vehicle_id]);

    if (vehicleRows.length === 0) {
      return new NextResponse('Vehicle not found', { status: 404 });
    }

    const vehicle = vehicleRows[0];

    // Determine target date & event details
    let eventTitle = `Rappel Entretien - ${vehicle.make} ${vehicle.model} (${vehicle.plate_number})`;
    let eventDescription = `Rappel d'entretien périodique pour votre véhicule ${vehicle.make} ${vehicle.model} (${vehicle.plate_number}).\nConsultez votre carnet d'entretien numérique en scannant votre carte QR Garage Pro.`;
    let targetDate = vehicle.next_service_date ? new Date(vehicle.next_service_date) : null;

    if (reminderType === 'inspection') {
      eventTitle = `Contrôle Technique - ${vehicle.make} ${vehicle.model} (${vehicle.plate_number})`;
      eventDescription = `Rappel d'échéance de Contrôle Technique pour votre véhicule ${vehicle.make} ${vehicle.model}.\nPrenez rendez-vous avec votre garage pour un pré-contrôle technique.`;
      targetDate = vehicle.next_inspection_date ? new Date(vehicle.next_inspection_date) : null;
    }

    // Default fallback: 30 days from now if not set
    if (!targetDate || isNaN(targetDate.getTime())) {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
    }

    // Format dates to ICS standard YYYYMMDDTHHMMSSZ
    const formatDateToICS = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = new Date(targetDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);

    const now = new Date();
    const uid = `garage-pro-${vehicle.id}-${reminderType}-${targetDate.getTime()}@garagepro.local`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Garage Pro//Carnet d Entretien Numérique//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDateToICS(now)}`,
      `DTSTART:${formatDateToICS(start)}`,
      `DTEND:${formatDateToICS(end)}`,
      `SUMMARY:${eventTitle}`,
      `DESCRIPTION:${eventDescription.replace(/\n/g, '\\n')}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Rappel: ${eventTitle}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const filename = `${reminderType === 'inspection' ? 'controle-technique' : 'rappel-entretien'}-${vehicle.plate_number.replace(/\s+/g, '-')}.ics`;

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to generate ICS:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
