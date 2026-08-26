import React from 'react';
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
  StatCard,
} from '@/components/ui';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-base text-text-primary selection:bg-accent selection:text-white relative overflow-x-hidden font-sans">
      {/* Precision Ambient Radial Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-blue-600/15 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Engineering Grid Overlay Pattern */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top Cockpit Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-surface-base/90 border-b border-border-subtle px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-base text-text-primary tracking-tight block leading-none">Garage Pro</span>
              <span className="text-[10px] text-accent font-bold uppercase tracking-widest block mt-0.5">Automotive SaaS & Cartes PVC</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link href="/annuaire">
              <Button variant="ghost" size="sm">
                Annuaire Ateliers
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" size="sm">
                Connexion Atelier →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-24 space-y-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-raised border border-border-default text-text-secondary text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Digitalisation des Ateliers Automobiles &bull; Zéro Application Mobile Requise</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-text-primary tracking-tight leading-[1.1]">
            Le Carnet d&apos;Entretien Numérique{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-accent to-indigo-400">
              Certifié par Carte PVC QR
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed font-normal">
            Remplacez les carnets papier par une carte physique rigide associée à chaque véhicule. Vos clients scannent leur badge pour consulter l&apos;historique complet des réparations, réserver des interventions et programmer leurs rappels.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button variant="primary" size="lg" className="px-8 shadow-xl shadow-blue-500/20">
                Accéder au Back-Office Atelier →
              </Button>
            </Link>
            <Link href="/admin/cards/studio">
              <Button variant="secondary" size="lg">
                Découvrir le Studio Cartes PVC
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Cockpit Metric Preview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Traçabilité Véhicules"
            value="100% Certifiée"
            subtitle="Historique inviolable lié au VIN"
            icon={
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <StatCard
            label="Impression Usine CR-80"
            value="300 DPI"
            subtitle="Cartes physiques laminées étanches"
            icon={
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Paiements Algérie"
            value="Chargily Pay"
            subtitle="BaridiMob, EDAHABIA & CIB"
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
          <StatCard
            label="Expédition Nationale"
            value="58 Wilayas"
            subtitle="Livraison suivie Yalidine Express"
            icon={
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            }
          />
        </div>

        {/* Feature Grid: 4 Core Pillars */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <Badge variant="info">Architecture & Modules</Badge>
            <h2 className="text-3xl font-black text-text-primary tracking-tight">Quatre Piliers Conçus pour les Professionnels</h2>
            <p className="text-text-secondary text-sm">Une suite intégrée pour fidéliser la clientèle et automatiser la gestion d&apos;atelier.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:border-border-default transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-accent flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <CardTitle className="text-base">Carnet d&apos;Entretien Certifié</CardTitle>
                <CardDescription>Traçabilité complète des interventions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Vidanges, pièces de rechange certifiées avec références OEM, notes d&apos;atelier et téléchargement direct des factures PDF.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-border-default transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-base">Prise de RDV 24/7</CardTitle>
                <CardDescription>Réservation client sans application</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Formulaire de réservation instantané directement après scan de la carte. Conversion en ordre de réparation en un clic.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-border-default transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-base">Spécifications & Diagnostic</CardTitle>
                <CardDescription>Fiches techniques et codes DTC</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Viscosité d&apos;huile préconisée, dimensions de pneumatiques et base de connaissances des pannes pour techniciens.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-border-default transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <CardTitle className="text-base">Rappels & Notifications</CardTitle>
                <CardDescription>Alertes SMS, WhatsApp et Calendrier</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Compte à rebours kilométrique avant prochaine vidange ou contrôle technique avec synchronisation iCal Apple / Google.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security & Physical Card Integration Section */}
        <Card className="p-8 sm:p-10 space-y-4 bg-surface-raised/80">
          <Badge variant="info">Sécurité & Confidentialité Cryptographique</Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Cartes PVC Pré-Imprimées et Jetons Non Énumérables
          </h2>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
            Chaque carte est générée par lot avec un jeton cryptographique aléatoire de 128 bits minimum. En cas de perte ou de vente du véhicule, l&apos;atelier révoque instantanément l&apos;ancienne carte et en réassigne une nouvelle sans jamais altérer l&apos;historique du véhicule. Aucune coordonnée personnelle du client n&apos;est divulguée lors du scan public.
          </p>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 text-center text-xs text-text-muted">
        <div className="max-w-7xl mx-auto px-4">
          Garage Pro &bull; Plateforme SaaS Professionnelle de Carnet d&apos;Entretien Numérique
        </div>
      </footer>
    </div>
  );
}
