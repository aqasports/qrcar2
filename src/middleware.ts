import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role;
    const isPlatformAdmin = Boolean(token.isPlatformAdmin || role === 'platform_admin');

    // 1. Platform Admin Routes (/platform-admin/*)
    if (path.startsWith('/platform-admin')) {
      if (!isPlatformAdmin) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      const response = NextResponse.next();
      response.headers.set('x-user-id', token.id);
      response.headers.set('x-user-role', role);
      return response;
    }

    // 2. Tenant Admin Routes (/admin/*)
    if (path.startsWith('/admin')) {
      // Technicians have restricted access
      if (role === 'technician') {
        if (
          path.startsWith('/admin/workers') ||
          path.startsWith('/admin/inventory') ||
          path.startsWith('/admin/invoices') ||
          path.startsWith('/admin/audit') ||
          path.startsWith('/admin/cards') ||
          path.startsWith('/admin/billing') ||
          path.startsWith('/admin/settings')
        ) {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }

      // Managers cannot view audit logs or billing settings
      if (role === 'manager') {
        if (path.startsWith('/admin/audit') || path.startsWith('/admin/billing')) {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }

      // Org-scoped headers for downstream API / server components
      const response = NextResponse.next();
      response.headers.set('x-organization-id', token.organizationId || '');
      response.headers.set('x-user-id', token.id);
      response.headers.set('x-user-role', role);
      return response;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/platform-admin/:path*'],
};
