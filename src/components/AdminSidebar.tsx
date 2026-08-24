'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/app/admin/SignOutButton';
import { Badge } from '@/components/ui';

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    roles: string[];
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
  }[];
}

export default function AdminSidebar({
  orgName,
  role,
  planSlug,
  brandColorPrimary = '#0f172a',
  username,
}: {
  orgName: string;
  role: string;
  planSlug: string;
  brandColorPrimary?: string;
  username: string;
}) {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (res.ok) {
          const d = await res.json();
          setUnreadMessages(d.unread_count || 0);
        }
      } catch (e) {
        // silent
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  const sections: NavSection[] = [
    {
      title: 'Cockpit & Télémétrie',
      items: [
        {
          name: 'Tableau de Bord',
          href: '/admin',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          name: 'Rendez-Vous (RDV)',
          href: '/admin/appointments',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Atelier & Opérations',
      items: [
        {
          name: 'Parc Véhicules',
          href: '/admin/vehicles',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          badge: 'VIN Auto-Fill',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
        },
        {
          name: 'Clients & Passeports',
          href: '/admin/clients',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
        {
          name: 'Interventions & OR',
          href: '/admin/actions',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
        },
        {
          name: 'Stock & Pièces Magasin',
          href: '/admin/inventory',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          name: 'Devis & Facturation',
          href: '/admin/invoices',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Écosystème B2B & Réseau',
      items: [
        {
          name: 'Marketplace Pièces',
          href: '/admin/marketplace',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          badge: 'B2B',
          badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          ),
        },
        {
          name: 'Diagnostic & Pannes (DTC)',
          href: '/admin/knowledgebase',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          badge: 'OBD-II',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
        },
        {
          name: 'Messagerie Inter-Garages',
          href: '/admin/messages',
          roles: ['owner', 'super_admin', 'manager', 'technician', 'platform_admin'],
          badge: unreadMessages > 0 ? `${unreadMessages} non lu` : undefined,
          badgeColor: 'bg-accent text-white shadow-sm shadow-blue-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          ),
        },
        {
          name: 'Annuaire National & SEO',
          href: '/admin/directory',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Cartes PVC Connectées',
      items: [
        {
          name: 'Studio Design CR-80',
          href: '/admin/cards/studio',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          badge: '300 DPI',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          name: 'Commander & Réassort',
          href: '/admin/cards/order',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: 'Inventaire Cartes',
          href: '/admin/cards',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Système & Administration',
      items: [
        {
          name: 'Notifications & Alertes',
          href: '/admin/notifications',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
        },
        {
          name: 'Équipe & Techniciens',
          href: '/admin/workers',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          name: 'Abonnement Chargily',
          href: '/admin/billing',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          badge: 'DZD',
          badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ),
        },
        {
          name: 'Paramètres Atelier',
          href: '/admin/settings',
          roles: ['owner', 'super_admin', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: 'App Store & Extensions',
          href: '/admin/apps',
          roles: ['owner', 'super_admin', 'manager', 'platform_admin'],
          badge: 'Store',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
        },
        {
          name: 'API Développeur',
          href: '/admin/settings/api',
          roles: ['owner', 'super_admin', 'platform_admin'],
          badge: 'REST',
          badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          ),
        },
        {
          name: 'Webhooks & Événements',
          href: '/admin/settings/webhooks',
          roles: ['owner', 'super_admin', 'platform_admin'],
          badge: 'HMAC',
          badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        },
        {
          name: 'Journal d’Audit',
          href: '/admin/audit',
          roles: ['owner', 'super_admin', 'platform_admin'],
          icon: (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-[#090d16] border-r border-white/[0.08] flex flex-col justify-between shrink-0 shadow-2xl z-40 backdrop-blur-2xl">
      <div className="flex-1 overflow-y-auto">
        {/* Brand & Organization Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-surface-raised/30">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/10 text-xs shrink-0 border border-white/[0.12]"
              style={{ backgroundColor: brandColorPrimary }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>

            <div className="overflow-hidden min-w-0 flex-1">
              <h2 className="font-extrabold text-text-primary leading-tight truncate text-sm">
                {orgName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info" size="sm">
                  {planSlug}
                </Badge>
                <span className="text-[10px] text-text-muted font-medium">Cockpit Atelier</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categorized Navigation Sections */}
        <nav className="p-3 space-y-6">
          {sections.map((section, sIdx) => {
            const visibleItems = section.items.filter((it) => it.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  {section.title}
                </h3>

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition duration-150 group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent text-white shadow-sm border border-blue-500/30'
                            : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent rounded-r-full shadow-[0_0_8px_#3b82f6]" />
                        )}

                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={
                              isActive
                                ? 'text-accent'
                                : 'text-text-muted group-hover:text-text-primary transition'
                            }
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.name}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 border ${
                              item.badgeColor || 'bg-white/[0.04] text-text-secondary border-white/[0.08]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Session & Logout Footer */}
      <div className="p-4 border-t border-white/[0.08] bg-surface-raised/40 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-surface-overlay border border-white/[0.08] flex items-center justify-center font-bold text-xs text-text-primary shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">{username}</p>
              <p className="text-[10px] text-accent font-semibold uppercase tracking-wider">
                {role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
