'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface DashboardData {
  revenue: { paid: number; issued: number; total: number };
  activeVehicles: number;
  pipeline: {
    reception: number;
    inProgress: number;
    qualityCheck: number;
    readyToDeliver: number;
  };
  leaderboard: Array<{ id: string; full_name: string; role: string; job_count: number }>;
  lowStockCount: number;
  totalParts: number;
  totalClients: number;
  totalVehicles: number;
  cardsData: {
    total: number;
    active: number;
    available: number;
  };
  myMarketplaceListings: number;
  myAuthoredSolutions: number;
  recentJobs: Array<{
    id: string;
    type: string;
    status: string;
    date_in: string;
    plate_number: string;
    make: string;
    model: string;
  }>;
}

export default function ExecutiveCockpitDashboard() {
  const { data: session } = useSession();
  const username = session?.user?.username || 'Chef d\'Atelier';
  const role = session?.user?.role || 'owner';
  const orgName = session?.user?.orgName || 'Atelier Principal';
  const planSlug = session?.user?.planSlug || 'pro';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickDtc, setQuickDtc] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Executive Telemetry Header Ribbon */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/80 to-blue-950/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                Poste de Commandement Atelier
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Télémétrie Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Bienvenue, {username}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Supervisez les flux de réparation, la traçabilité des cartes PVC connectées et les opportunités réseau B2B.
            </p>
          </div>

          {/* Quick Action Launchpad */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              href="/admin/vehicles"
              className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20 flex flex-col items-center justify-center text-center gap-1.5 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>+ Entrée Véhicule</span>
            </Link>

            <Link
              href="/admin/invoices"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex flex-col items-center justify-center text-center gap-1.5"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Créer Devis / Facture</span>
            </Link>

            <Link
              href="/admin/knowledgebase"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex flex-col items-center justify-center text-center gap-1.5"
            >
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Rechercher DTC</span>
            </Link>

            <Link
              href="/admin/marketplace"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex flex-col items-center justify-center text-center gap-1.5"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Marketplace Pièces</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Telemetry KPI Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Chiffre d'Affaires */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Chiffre d&apos;Affaires Mensuel
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-100 block">
              {(data?.revenue?.total || 0).toLocaleString('fr-FR')} <span className="text-xs font-bold text-slate-400 font-sans">DZD</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
            <span>Encaissé : {(data?.revenue?.paid || 0).toLocaleString('fr-FR')} DA</span>
            <span>Émis : {(data?.revenue?.issued || 0).toLocaleString('fr-FR')} DA</span>
          </div>
        </div>

        {/* Metric 2: Flux Véhicules */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Véhicules en Traitement
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-100 block">
              {data?.activeVehicles || 0}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
            <span>En atelier actif</span>
            <span className="text-blue-400">{data?.totalVehicles || 0} total flotte</span>
          </div>
        </div>

        {/* Metric 3: Cartes PVC Connectées */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cartes PVC Connectées
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-100 block">
              {data?.cardsData?.active || 0}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
            <span>Passeports en circulation</span>
            <span className="text-purple-400 font-bold">{data?.cardsData?.available || 0} cartes dispo</span>
          </div>
        </div>

        {/* Metric 4: Réseau B2B & Solutions */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Écosystème B2B & Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-100 block">
              {data?.myMarketplaceListings || 0} <span className="text-xs font-bold text-slate-400 font-sans">pièces B2B</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
            <span>{data?.myAuthoredSolutions || 0} solutions DTC</span>
            <span className={data?.lowStockCount ? 'text-amber-400 font-bold' : 'text-slate-500'}>
              {data?.lowStockCount || 0} alertes réassort
            </span>
          </div>
        </div>
      </div>

      {/* 3. Live Workshop Pipeline (Kanban Ribbon) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Pipeline & Flux d&apos;Atelier en Direct
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Progression des véhicules à travers les 4 étapes de production</p>
          </div>

          <Link href="/admin/actions" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition">
            Consulter les Ordres de Réparation &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Stage 1 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              <span>1. Réception & OBD</span>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-slate-100">
              {data?.pipeline?.reception || 0}
            </div>
            <p className="text-[10px] text-slate-500">Véhicules enregistrés en attente de diagnostic</p>
          </div>

          {/* Stage 2 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              <span>2. En Réparation</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {data?.pipeline?.inProgress || 0}
            </div>
            <p className="text-[10px] text-slate-500">Travaux mécaniques ou électroniques en cours</p>
          </div>

          {/* Stage 3 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              <span>3. Contrôle Qualité</span>
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-purple-400">
              {data?.pipeline?.qualityCheck || 0}
            </div>
            <p className="text-[10px] text-slate-500">Essais sur route et validation finale</p>
          </div>

          {/* Stage 4 */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              <span>4. Prêt & Facturé</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {data?.pipeline?.readyToDeliver || 0}
            </div>
            <p className="text-[10px] text-slate-500">Véhicules prêts pour restitution client</p>
          </div>
        </div>
      </div>

      {/* 4. Recent Interventions & Technician Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Service Actions (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Dernières Interventions Réalisées
            </h3>
            <Link href="/admin/actions" className="text-xs text-blue-400 font-bold hover:underline">
              Historique Complet &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (data?.recentJobs || []).length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Aucune intervention récente. Créez un ordre de réparation pour débuter.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data?.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/admin/actions/${job.id}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition group"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {job.plate_number}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {job.make} {job.model}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 capitalize mt-0.5 truncate">
                      {job.type} • {new Date(job.date_in).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                      job.status === 'completed' || job.status === 'invoiced'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {job.status === 'completed' ? 'Terminé' : job.status === 'invoiced' ? 'Facturé' : 'En cours'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Technician Performance Leaderboard (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Productivité Équipe
            </h3>
            <Link href="/admin/workers" className="text-xs text-blue-400 font-bold hover:underline">
              Gérer &rarr;
            </Link>
          </div>

          {(data?.leaderboard || []).length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Aucun technicien enregistré.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.leaderboard.map((w, idx) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{w.full_name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase">{w.role}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                    {w.job_count} travaux
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
