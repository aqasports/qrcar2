import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from '../admin/SignOutButton';

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isPlatformAdmin = Boolean(session.user.isPlatformAdmin || session.user.role === 'platform_admin');
  if (!isPlatformAdmin) {
    redirect('/admin');
  }

  const username = session.user.username;

  return (
    <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden font-sans">
      {/* Platform Admin Sidebar */}
      <aside className="w-72 bg-surface-raised border-r border-rose-500/20 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-border-subtle flex items-center gap-3 bg-rose-950/20">
            <div className="w-10 h-10 rounded-xl bg-danger flex items-center justify-center font-black text-white shadow-lg shadow-rose-600/30 text-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="font-black text-text-primary leading-tight text-sm">Platform Admin</h2>
              <span className="text-[10px] text-danger font-bold uppercase tracking-wider">Superuser God-View</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <Link
              href="/platform-admin"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition duration-150"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Garages & Abonnements</span>
            </Link>

            <Link
              href="/platform-admin/card-designs"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition duration-150"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Validation Studio Cartes</span>
            </Link>

            <Link
              href="/platform-admin/card-orders"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition duration-150"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Commandes & Expéditions</span>
            </Link>

            <Link
              href="/platform-admin/apps"
              className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition duration-150"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Modération App Store</span>
            </Link>

            <div className="pt-4 mt-4 border-t border-border-subtle">
              <span className="px-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Navigation Système</span>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2.5 mt-2 text-xs font-semibold rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition duration-150"
              >
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Retour Interface Atelier</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* User Info / Sign Out */}
        <div className="p-4 border-t border-border-subtle bg-surface-base/40">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-text-primary truncate">{username}</p>
              <p className="text-[10px] text-danger font-bold uppercase tracking-wider">PLATFORM OPERATOR</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-border-subtle flex items-center justify-between px-8 bg-surface-raised/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-black text-danger uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              Console de Supervision Plateforme
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted font-mono bg-surface-base px-3 py-1 rounded-lg border border-border-subtle">
              Devise: DZD (BaridiMob / EDAHABIA)
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-surface-base p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
