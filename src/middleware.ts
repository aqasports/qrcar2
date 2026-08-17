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

    // Technician restrictions
    if (role === 'technician') {
      // Technicians cannot access workers list, parts inventory, invoices, audit logs, or card batching
      if (
        path.startsWith('/admin/workers') ||
        path.startsWith('/admin/inventory') ||
        path.startsWith('/admin/invoices') ||
        path.startsWith('/admin/audit') ||
        path.startsWith('/admin/cards')
      ) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    // Manager restrictions
    if (role === 'manager') {
      // Managers can access everything EXCEPT audit logs
      if (path.startsWith('/admin/audit')) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
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
  matcher: ['/admin/:path*'],
};
