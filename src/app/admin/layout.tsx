import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { sql } from '@/lib/db';
import { Locale } from '@/lib/i18n/dictionaries';
import AdminSidebar from '@/components/AdminSidebar';
import AdminCockpitHeader from '@/components/AdminCockpitHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;
  const username = session.user.username;
  const orgName = session.user.orgName || 'Garage Pro';
  const planSlug = session.user.planSlug || 'pro';
  const orgId = session.user.organizationId;

  // Fetch organization branding colors and default locale
  let brandColorPrimary = '#0f172a';
  let orgLocale: Locale = 'fr';

  try {
    const orgRows = await sql(
      `SELECT brand_color_primary, locale FROM organizations WHERE id = $1 LIMIT 1`,
      [orgId]
    );
    if (orgRows.length > 0) {
      brandColorPrimary = orgRows[0].brand_color_primary || '#0f172a';
      orgLocale = (orgRows[0].locale as Locale) || 'fr';
    }
  } catch (e) {
    console.error('Failed to fetch org branding for layout:', e);
  }

  return (
    <I18nProvider initialLocale={orgLocale}>
      <div className="flex h-screen bg-surface-base text-text-primary overflow-hidden font-sans antialiased selection:bg-accent selection:text-white">
        {/* Categorized Executive Sidebar */}
        <AdminSidebar
          orgName={orgName}
          role={role}
          planSlug={planSlug}
          brandColorPrimary={brandColorPrimary}
          username={username}
        />

        {/* Main Command Station Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-base">
          {/* Top Interactive Cockpit Header */}
          <AdminCockpitHeader orgName={orgName} role={role} planSlug={planSlug} />

          {/* Dynamic Page Scroll Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-radial-gradient">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </I18nProvider>
  );
}
