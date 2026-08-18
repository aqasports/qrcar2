'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');
  const canceledParam = searchParams.get('canceled');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/billing');
      if (!res.ok) throw new Error('Erreur lors du chargement des informations de facturation.');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger la facturation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handleCheckout = async (planSlug: string) => {
    try {
      setCheckoutLoading(planSlug);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_slug: planSlug }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Impossible d’initialiser le paiement Chargily.');
      }

      if (json.checkout_url) {
        window.location.href = json.checkout_url;
      }
    } catch (err: any) {
      alert(err.message || 'Erreur de paiement.');
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const details = data?.details;
  const currentPlan = details?.plan;
  const usage = details?.usage;

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Facturation & Abonnement Atelier</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez votre abonnement SaaS, vos quotas d&apos;utilisation et vos paiements via BaridiMob / EDAHABIA / CIB.
          </p>
        </div>
      </div>

      {/* Success / Canceled Notifications */}
      {successParam && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 shadow-lg shadow-emerald-900/20">
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Paiement BaridiMob confirmé !</p>
            <p className="text-xs text-emerald-400/80">Votre abonnement a été renouvelé avec succès. Merci pour votre confiance.</p>
          </div>
        </div>
      )}

      {canceledParam && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-3">
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">Paiement interrompu</p>
            <p className="text-xs text-amber-400/80">La session de paiement Chargily n&apos;a pas abouti. Vous pouvez relancer le règlement à tout moment.</p>
          </div>
        </div>
      )}

      {/* Subscription Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Forfait Actif</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                details?.subscriptionStatus === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : details?.subscriptionStatus === 'trialing'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {details?.subscriptionStatus === 'trialing' ? 'Essai Gratuit' : details?.subscriptionStatus}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <h2 className="text-3xl font-black text-slate-100 tracking-tight">{currentPlan?.name}</h2>
              <span className="text-xl font-bold text-amber-400">
                {currentPlan?.priceMonthly?.toLocaleString('fr-FR')} DZD <span className="text-xs text-slate-400 font-normal">/ mois</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {details?.isTrial && details.trialEndsAt && (
                <span>Votre période d&apos;essai expire le <strong>{new Date(details.trialEndsAt).toLocaleDateString('fr-FR')}</strong>.</span>
              )}
              {details?.subscriptionStatus === 'active' && details.currentPeriodEndsAt && (
                <span>Prochain renouvellement prévu le <strong>{new Date(details.currentPeriodEndsAt).toLocaleDateString('fr-FR')}</strong>.</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleCheckout(currentPlan?.slug || 'pro')}
              disabled={Boolean(checkoutLoading)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 text-xs flex items-center gap-2 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {checkoutLoading === currentPlan?.slug ? (
                <span>Redirection BaridiMob...</span>
              ) : (
                <span>Payer avec BaridiMob / EDAHABIA</span>
              )}
            </button>
          </div>
        </div>

        {/* Quota Progress Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-800">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Succursales & Ateliers</span>
              <span className="text-slate-200">{usage?.branchesCount} / {currentPlan?.maxBranches}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((usage?.branchesCount || 1) / (currentPlan?.maxBranches || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Utilisateurs & Techniciens</span>
              <span className="text-slate-200">{usage?.seatsCount} / {currentPlan?.maxSeats}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((usage?.seatsCount || 1) / (currentPlan?.maxSeats || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Studio Cartes & Visibilité</span>
              <span className="text-emerald-400 font-bold uppercase text-[10px]">{currentPlan?.cardStudioTier}</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div className="bg-emerald-500 h-2 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Options Comparison */}
      <div>
        <h3 className="text-lg font-bold text-slate-100 mb-6">Changer de Forfait</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              slug: 'starter',
              name: 'Starter',
              price: '4,900 DZD',
              desc: 'Idéal pour les garages indépendants avec un atelier unique.',
              features: [
                '1 Succursale atelier',
                '3 Comptes utilisateurs',
                'Cartes PVC pré-imprimées',
                'Gestion clients & véhicules',
                'Facturation & devis PDF',
                'Annuaire garages : Référencé',
              ],
            },
            {
              slug: 'pro',
              name: 'Pro (Populaire)',
              price: '12,900 DZD',
              popular: true,
              desc: 'Pour les ateliers en expansion souhaitant leur propre identité PVC.',
              features: [
                'Jusqu’à 3 Succursales',
                '15 Comptes utilisateurs',
                'Studio Design Cartes PVC sur-mesure',
                '20 Annonces Pièces / mois',
                'Messagerie directe mécanique',
                'Annuaire garages : Featured (En vedette)',
              ],
            },
            {
              slug: 'enterprise',
              name: 'Enterprise',
              price: '29,900 DZD',
              desc: 'Pour les réseaux de garages, concessionnaires et franchises.',
              features: [
                'Succursales & Sièges illimités',
                'Comptes utilisateurs illimités',
                'Studio Design PVC + Marque Blanche',
                'Annonces Marketplace illimitées',
                'Annuaire garages : Spotlight (Top classement)',
                'Support prioritaire dédié 24/7',
              ],
            },
          ].map((plan) => {
            const isCurrent = currentPlan?.slug === plan.slug;
            return (
              <div
                key={plan.slug}
                className={`bg-slate-900 border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition ${
                  plan.popular
                    ? 'border-blue-500/50 shadow-2xl shadow-blue-500/10 relative'
                    : 'border-slate-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                    Recommandé
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-slate-100">{plan.name}</h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase">
                        Actuel
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-2 min-h-[32px]">{plan.desc}</p>

                  <div className="mt-4 pb-6 border-b border-slate-800">
                    <span className="text-2xl font-black text-slate-100">{plan.price}</span>
                    <span className="text-xs text-slate-500"> / mois</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs text-slate-300">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/80">
                  <button
                    onClick={() => handleCheckout(plan.slug)}
                    disabled={Boolean(checkoutLoading)}
                    className={`w-full font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition ${
                      isCurrent
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : plan.popular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white'
                    }`}
                  >
                    {checkoutLoading === plan.slug ? (
                      <span>Chargement...</span>
                    ) : isCurrent ? (
                      <span>Renouveler via BaridiMob</span>
                    ) : (
                      <span>Basculer vers {plan.name}</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
