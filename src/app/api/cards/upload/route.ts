import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImageToThirdParty } from '@/lib/third-party-upload';
import { apiUnauthorized, apiForbidden, apiServerError } from '@/lib/api/response';

// POST /api/cards/upload - Upload an image to third-party host for PVC card designs
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { role, organizationId } = session.user;
  if (role === 'technician') {
    return apiForbidden('Non autorisé à téléverser des visuels de cartes.');
  }

  try {
    const body = await req.json();
    const { image, filename = 'card_logo.png', mimeType = 'image/png', tags = [] } = body;

    if (!image) {
      return NextResponse.json({ error: "Aucune donnée d'image fournie." }, { status: 400 });
    }

    const uploadResult = await uploadImageToThirdParty({
      fileBase64: image,
      filename,
      mimeType,
      organizationId,
      tags,
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      displayUrl: uploadResult.displayUrl || uploadResult.url,
      provider: uploadResult.provider,
      filename: uploadResult.filename,
      sizeBytes: uploadResult.sizeBytes,
      checksum: uploadResult.checksum,
      uploadedAt: uploadResult.uploadedAt,
    });
  } catch (error: any) {
    console.error('Failed to upload card studio image:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du téléversement vers le serveur distant.' },
      { status: 500 }
    );
  }
}
