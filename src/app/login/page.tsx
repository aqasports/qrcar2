'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Input,
} from '@/components/ui';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Identifiant ou mot de passe incorrect. Veuillez vérifier vos accès.");
      } else {
        router.push('/admin');
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur système est survenue lors de l'authentification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex flex-col items-center justify-center p-4 relative overflow-hidden text-text-primary font-sans">
      {/* Precision ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <Card className="w-full max-w-md shadow-2xl border-border-default bg-surface-raised/95 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent text-white font-black text-xl shadow-lg shadow-blue-500/20 mx-auto mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <CardTitle className="text-xl">Garage Pro Back-Office</CardTitle>
          <CardDescription>Portail de gestion atelier et traçabilité des véhicules</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Identifiant Utilisateur"
              required
              autoComplete="username"
              placeholder="ex. admin, manager ou tech"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Input
              label="Mot de Passe"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
              size="lg"
            >
              Se Connecter à l&apos;Atelier →
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex items-center justify-between text-xs text-text-muted border-t border-border-subtle pt-4">
          <Link href="/" className="hover:text-text-primary transition">
            ← Retour à l&apos;accueil
          </Link>
          <Link href="/annuaire" className="hover:text-text-primary transition">
            Annuaire public ↗
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
