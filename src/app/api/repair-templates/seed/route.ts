import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { seedOrganizationTemplates } from '@/lib/seed-templates';
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiServerError,
} from '@/lib/api/response';

// POST /api/repair-templates/seed - Force re-seed starter templates
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return apiUnauthorized();
  }

  const { organizationId, id: userId, role } = session.user;
  if (role === 'technician') {
    return apiError('Permission refusée.', 'FORBIDDEN', 403);
  }

  try {
    const inserted = await seedOrganizationTemplates(organizationId, userId);
    return apiSuccess({
      count: inserted,
      message: `${inserted} modèles d'interventions préconfigurés ont été ajoutés à votre atelier.`,
    });
  } catch (error) {
    console.error('Failed to seed templates:', error);
    return apiServerError();
  }
}
