'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin route runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <h3 className="text-lg font-bold text-text-primary tracking-tight mb-1">
        Une erreur est survenue lors du chargement
      </h3>
      <p className="text-xs text-text-secondary max-w-md mb-6 leading-relaxed">
        Impossible de charger les données de cette section. Veuillez vérifier votre connexion ou réessayer.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
          Recharger la page
        </Button>
        <Button variant="primary" size="sm" onClick={() => reset()}>
          Réessayer
        </Button>
      </div>
    </div>
  );
}
