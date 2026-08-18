import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { decodeVin } from '@/lib/vin-decoder';
import { checkRateLimit } from '@/lib/rate-limit';

// GET /api/vin/decode?vin={17_CHAR_VIN} - Decode VIN to full automotive specs with Rate Limiting
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId } = session.user;
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  // Rate limit: 30 decodes per minute per organization
  const rl = checkRateLimit(`vin_decode_${organizationId || ip}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Limite de requêtes atteinte. Veuillez patienter avant de décoder à nouveau.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rl.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const vin = searchParams.get('vin')?.trim().toUpperCase();

  if (!vin) {
    return NextResponse.json({ error: 'Le paramètre VIN est requis.' }, { status: 400 });
  }

  try {
    const specs = await decodeVin(vin);
    return NextResponse.json(specs);
  } catch (error: any) {
    console.error('Failed to decode VIN:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du décodage du numéro de châssis.' },
      { status: 400 }
    );
  }
}
