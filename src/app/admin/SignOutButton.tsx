'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="w-full bg-surface-overlay hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-sm py-2.5 px-4 rounded-xl transition duration-150 active:scale-[0.98]"
    >
      Sign Out
    </button>
  );
}
