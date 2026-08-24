'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import CommandPalette from '@/components/CommandPalette';
import { Button, Badge } from '@/components/ui';

export default function AdminCockpitHeader({
  orgName,
  role,
  planSlug,
}: {
  orgName: string;
  role: string;
  planSlug: string;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    async function checkUnread() {
      try {
        const res = await fetch('/api/messages/unread-count');
        if (res.ok) {
          const data = await res.json();
          setUnreadMessages(data.unread_count || 0);
        }
      } catch (e) {
        // silent
      }
    }
    checkUnread();
    const interval = setInterval(checkUnread, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <header className="h-16 border-b border-white/[0.08] flex items-center justify-between px-6 bg-[#090d16]/80 backdrop-blur-xl shrink-0 z-30 font-sans">
        {/* Left Side: Global Search / Command Bar Trigger */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-accent/40 text-text-muted hover:text-text-primary transition shadow-inner w-64 sm:w-80 group text-xs font-medium cursor-pointer"
          >
            <svg className="w-4 h-4 text-text-muted group-hover:text-accent transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left truncate text-text-secondary">Recherche globale, VIN, DTC...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-overlay border border-white/[0.1] text-[10px] font-mono text-text-muted">
              <span>⌘</span>K
            </kbd>
          </button>

          {/* Telemetry Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-raised/80 border border-white/[0.08] text-[11px] font-mono text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
            <span>SYSTÈME CONNECTÉ</span>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons, Notifications, Language Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/admin/actions/new" className="hidden sm:block">
            <Button
              variant="primary"
              size="sm"
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              }
            >
              Nouvel OR
            </Button>
          </Link>

          {/* Direct Inter-Garage Messaging Quick Launcher */}
          <Link
            href="/admin/messages"
            className="relative p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.18] text-text-secondary hover:text-text-primary transition"
            title="Messagerie Directe Inter-Garages"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse">
                {unreadMessages}
              </span>
            )}
          </Link>

          {/* Multi-lingual switcher */}
          <div className="border-l border-white/[0.08] pl-3">
            <LocaleSwitcher />
          </div>
        </div>
      </header>
    </>
  );
}
