import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background Lighting Gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-600/10 via-slate-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-border-subtle px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-base text-slate-100 tracking-tight block leading-none">Garage Pro</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mt-0.5">Automotive SaaS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/10 active:scale-95"
            >
              <span>Connexion Atelier</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-16 pb-24 space-y-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Digitalisation des Ateliers Automobiles &bull; Zéro Application Mobile Requise</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight leading-[1.1]">
            Le Carnet d&apos;Entretien Numérique{' '}
            <span className="text-blue-500">
              Certifié par Carte PVC QR
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Remplacez les carnets d&apos;entretien papier par une carte physique inviolable associée à chaque véhicule. Vos clients scannent le code avec leur smartphone pour consulter l&apos;historique complet des réparations, réserver des interventions et programmer leurs rappels.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98"
            >
              <span>Accéder au Back-Office Atelier</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Feature Grid: 4 Core Pillars */}
        <div className="space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Architecture & Modules</span>
            <h2 className="text-3xl font-black text-slate-100 tracking-tight">Quatre Piliers Conçus pour les Professionnels</h2>
            <p className="text-slate-400 text-sm">Une suite intégrée pour fidéliser la clientèle et automatiser la gestion d&apos;atelier.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-slate-100">Carnet d&apos;Entretien Certifié</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Traçabilité intégrale de chaque opération : vidanges, pièces de rechange certifiées avec références, notes d&apos;atelier et téléchargement direct des factures PDF.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-slate-100">Prise de Rendez-Vous 24/7</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Formulaire de réservation instantané directement après scan. L&apos;atelier reçoit la demande et la convertit en intervention en un seul clic.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-slate-100">Spécifications & Diagnostic</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fiche technique constructeur (viscosité d&apos;huile, dimensions de pneumatiques) et glossaire complet des voyants du tableau de bord avec actions préconisées.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 hover:border-slate-700 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-bold text-base text-slate-100">Rappels & Synchronisation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compte à rebours kilométrique et temporel avant prochaine vidange ou contrôle technique, avec export iCalendar (.ics) vers Apple & Google Calendar.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Physical Card Integration Section */}
        <div className="bg-slate-900/60 border border-slate-800 p-8 sm:p-12 rounded-3xl space-y-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Sécurité & Confidentialité</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Cartes PVC Pré-Imprimées et Tokens Non Énumérables
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Chaque carte est générée par lot avec un jeton cryptographique aléatoire de 128 bits minimum. En cas de perte ou de vente du véhicule, l&apos;atelier révoque instantanément l&apos;ancienne carte et en réassigne une nouvelle sans jamais altérer l&apos;historique du véhicule. Aucune donnée personnelle du client (adresse, téléphone personnel) n&apos;est exposée lors du scan public.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4">
          Garage Pro &bull; Plateforme SaaS Professionnelle de Carnet d&apos;Entretien Numérique
        </div>
      </footer>
    </div>
  );
}
