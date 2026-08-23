import { NextRequest, NextResponse } from 'next/server';
import { resolveApiKey } from '@/lib/resolve-api-key';
import { checkDurableRateLimit } from '@/lib/rate-limit';
import { formatErrorResponse, RateLimitError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = await resolveApiKey(authHeader);

    // Durable Rate Limit evaluation
    const rateLimit = await checkDurableRateLimit({
      apiKeyId: apiKey.apiKeyId,
      organizationId: apiKey.organizationId,
      method: 'GET',
      path: '/api/public/v1/me',
      limit: apiKey.rateLimitPerMinute,
      windowSeconds: 60,
    });

    if (!rateLimit.success) {
      throw new RateLimitError(rateLimit.resetSeconds);
    }

    const response = NextResponse.json({
      success: true,
      data: {
        apiKey: {
          id: apiKey.apiKeyId,
          prefix: apiKey.keyPrefix,
          appName: apiKey.appName,
          appId: apiKey.appId,
          scopes: apiKey.scopes,
        },
        organization: {
          id: apiKey.organizationId,
          name: apiKey.orgName,
          slug: apiKey.orgSlug,
          subscriptionStatus: apiKey.subscriptionStatus,
          plan: apiKey.planSlug,
        },
        rateLimit: {
          limitPerMinute: apiKey.rateLimitPerMinute,
          remaining: rateLimit.remaining,
          resetSeconds: rateLimit.resetSeconds,
        },
      },
    });

    response.headers.set('X-RateLimit-Limit', apiKey.rateLimitPerMinute.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetSeconds.toString());

    return response;
  } catch (error: any) {
    const formatted = formatErrorResponse(error);
    const status = error.statusCode || 500;
    return NextResponse.json(formatted, { status });
  }
}
