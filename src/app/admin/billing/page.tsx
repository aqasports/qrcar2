'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  StatCard,
  CurrencyDisplay,
  Spinner,
} from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');
  const canceledParam = searchParams.get('canceled');
  const { toast } = useToast();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/billing');
      if (!res.ok) throw new Error('Erreur lors du chargement des informations de facturation.');
      const json = await res.json();
      setData(json?.data || json);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger la facturation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  useEffect(() => {
    if (successParam) {
      toast.success('Abonnement validé ! Votre forfait a été activé immédiatement.');
    }
    if (canceledParam) {
      toast.warning('Paiement annulé. Aucun débit n’a été effectué.');
    }
  }, [successParam, canceledParam, toast]);

  const handleCheckout = async (planSlug: string) => {
    try {
      setCheckoutLoading(planSlug);
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_slug: planSlug }),
      });

      const json = await res.json();
      const payload = json?.data || json;
      if (!res.ok) {
        throw new Error(payload.error || 'Impossible d’initialiser le paiement Chargily.');
      }

      if (payload.checkout_url) {
        window.location.href = payload.checkout_url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur de paiement Chargily.');
      setCheckoutLoading(null);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      window.location.href = '/api/organization/export';
      toast.success('Export des données atelier en cours de téléchargement...');
    } catch (err: any) {
      toast.error('Erreur lors de l’export des données.');
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted font-medium">{t.common.loading}</p>
      </div>
    );
  }

  const details = data?.details;
  const currentPlan = details?.plan;
  const usage = details?.usage;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.billing.title}
        subtitle={t.billing.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.sidebar.billing },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportData}
            isLoading={exporting}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            {t.common.export} JSON
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Dunning Notice */}
      {details?.isPastDue && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          details.isGracePeriod
            ? 'bg-warning/10 border-warning/30 text-warning'
            : 'bg-danger/10 border-danger/30 text-danger'
        }`}>
          <div>
            <p className="font-bold text-sm">
              {details.isGracePeriod ? 'Période de grâce active' : 'Abonnement en attente de régularisation'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5 max-w-xl">
              {details.dunningNotice || 'Veuillez renouveler votre abonnement pour continuer à profiter de toutes les fonctionnalités.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCheckout(currentPlan?.slug || 'starter')}
          >
            {t.billing.payWithBaridiMob}
          </Button>
        </div>
      )}

      {/* Quota & Usage StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.billing.currentPlan}
          value={currentPlan?.name || 'Starter'}
          subtitle={`Statut : ${details?.subscription?.status || 'Actif'}`}
          badge={<Badge variant="success">Actif</Badge>}
          icon={
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />

        <StatCard
          label={t.vehicles.title.split('&')[0]}
          value={`${usage?.vehiclesCount || 0} / ${currentPlan?.max_vehicles ?? '∞'}`}
          subtitle="Capacité de la flotte atelier"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <StatCard
          label={t.cards.title.split('&')[0]}
          value={`${usage?.cardsCount || 0} / ${currentPlan?.max_cards ?? '∞'}`}
          subtitle="Passeports physiques associés"
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />

        <StatCard
          label={t.workers.title.split('&')[0]}
          value={`${usage?.usersCount || 0} / ${currentPlan?.max_users ?? '∞'}`}
          subtitle="Comptes d'accès atelier"
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Plan Selection Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Choisir ou Renouveler Votre Forfait</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.plans?.map((p: any) => {
            const isCurrent = currentPlan?.slug === p.slug;
            return (
              <Card
                key={p.id}
                className={`relative flex flex-col justify-between ${
                  p.slug === 'pro'
                    ? 'border-accent shadow-lg shadow-blue-500/10'
                    : ''
                }`}
              >
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{p.name}</CardTitle>
                      {p.slug === 'pro' && <Badge variant="info">Recommandé</Badge>}
                      {isCurrent && <Badge variant="success">Forfait Actif</Badge>}
                    </div>
                    <CardDescription>{p.description || 'Solution complète de gestion atelier et cartes connectées'}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <CurrencyDisplay
                        amount={p.price_dzd || p.price_monthly || 0}
                        size="xl"
                        className="text-text-primary font-black"
                      />
                      <span className="text-xs text-text-muted">/ mois</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-text-secondary border-t border-border-subtle pt-4">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Jusqu&apos;à <strong className="text-text-primary">{p.max_vehicles ?? 'Illimité'}</strong> véhicules</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Jusqu&apos;à <strong className="text-text-primary">{p.max_cards ?? 'Illimité'}</strong> cartes PVC</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Jusqu&apos;à <strong className="text-text-primary">{p.max_users ?? p.max_seats ?? 'Illimité'}</strong> comptes d&apos;accès</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{t.billing.payWithBaridiMob}</span>
                      </li>
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="pt-4 border-t border-border-subtle">
                  <Button
                    variant={isCurrent ? 'secondary' : p.slug === 'pro' ? 'primary' : 'secondary'}
                    className="w-full"
                    disabled={isCurrent}
                    isLoading={checkoutLoading === p.slug}
                    onClick={() => handleCheckout(p.slug)}
                  >
                    {isCurrent ? t.billing.currentPlan : t.billing.payWithBaridiMob}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
