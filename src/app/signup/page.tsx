'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, Input } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    org_name: '',
    org_slug: '',
    owner_name: '',
    phone: '',
    email: '',
    username: '',
    password: '',
    address: '',
    plan_slug: 'pro',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      org_name: val,
      org_slug: autoSlug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’inscription.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-text-primary font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center font-bold text-white shadow-xl shadow-blue-600/20">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
          Créer un compte Garage SaaS
        </h2>
        <p className="text-sm text-text-muted">
          Rejoignez la première plateforme connectée pour ateliers et garages en Algérie.
          <br />
          <span className="text-amber-400 font-semibold">14 jours d&apos;essai gratuit inclus</span> sans carte bancaire.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        <Card className="py-8 px-6 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Compte atelier configuré ! Redirection vers la page de connexion...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Informations de l'Atelier */}
            <div className="border-b border-border-subtle pb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                1. Identification de l&apos;Atelier / Garage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom du Garage / Atelier"
                  required
                  placeholder="ex: Auto Diagnostic Pro"
                  value={formData.org_name}
                  onChange={handleNameChange}
                />

                <Input
                  label="Identifiant URL (Slug)"
                  required
                  placeholder="auto-diagnostic-pro"
                  className="font-mono"
                  value={formData.org_slug}
                  onChange={(e) => setFormData({ ...formData, org_slug: e.target.value })}
                />

                <Input
                  label="Numéro de Téléphone Professionnel"
                  type="tel"
                  required
                  placeholder="0550 12 34 56"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <Input
                  label="Wilaya & Ville / Adresse"
                  placeholder="ex: Bab Ezzouar, Alger"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* Section 2: Compte Administrateur */}
            <div className="border-b border-border-subtle pb-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                2. Compte Propriétaire / Gérant
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom & Prénom du Responsable"
                  placeholder="ex: Karim Benali"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />

                <Input
                  label="Email de contact"
                  type="email"
                  placeholder="contact@garage.dz"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <Input
                  label="Nom d'utilisateur de connexion"
                  required
                  placeholder="k.benali"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />

                <Input
                  label="Mot de passe sécurisé"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Section 3: Choix du Forfait */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                3. Sélection du Forfait (Essai 14j gratuit)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    slug: 'starter',
                    name: 'Starter',
                    price: '4,900 DZD / mois',
                    features: ['1 Succursale', '3 Utilisateurs', 'Cartes Préréglées'],
                  },
                  {
                    slug: 'pro',
                    name: 'Pro (Recommandé)',
                    price: '12,900 DZD / mois',
                    features: ['3 Succursales', '15 Utilisateurs', 'Studio Cartes Complet', '20 Annonces Marketplace'],
                    popular: true,
                  },
                  {
                    slug: 'enterprise',
                    name: 'Enterprise',
                    price: '29,900 DZD / mois',
                    features: ['Illimité', 'Marque Blanche', 'Spotlight Annuaire'],
                  },
                ].map((plan) => {
                  const selected = formData.plan_slug === plan.slug;
                  return (
                    <div
                      key={plan.slug}
                      onClick={() => setFormData({ ...formData, plan_slug: plan.slug })}
                      className={`cursor-pointer rounded-2xl p-4 border transition ${
                        selected
                          ? 'border-accent bg-accent/15 shadow-lg shadow-blue-500/10'
                          : 'border-border-subtle bg-surface-base hover:border-border-default'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-text-primary">{plan.name}</span>
                        {selected && (
                          <span className="w-2 h-2 rounded-full bg-accent"></span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-amber-400 mt-1">{plan.price}</p>
                      <ul className="mt-3 space-y-1 text-[11px] text-text-muted">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              variant="primary"
              size="lg"
              className="w-full mt-8"
              rightIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              }
            >
              Créer mon Garage et Démarrer l&apos;Essai Gratuit
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-text-muted border-t border-border-subtle pt-5">
            Vous avez déjà un atelier enregistré ?{' '}
            <Link href="/login" className="text-accent hover:underline font-semibold">
              Se connecter
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
