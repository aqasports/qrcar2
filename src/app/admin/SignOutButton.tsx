'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="w-full bg-surface-overlay hover:bg-surface-hover border border-border-subtle text-text-secondary hover:text-text-primary font-semibold text-xs py-2.5 px-4 rounded-xl transition duration-150 active:scale-[0.98] cursor-pointer select-none"
    >
      Déconnexion
    </button>
  );
}
