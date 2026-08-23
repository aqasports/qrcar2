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
  developerStats?: {
    installedAppsCount: number;
    activeApiKeysCount: number;
    activeWebhooksCount: number;
  };
}

export default function ExecutiveCockpitDashboard() {
  const { data: session } = useSession();
  const username = session?.user?.username || 'Chef d\'Atelier';
  const orgName = session?.user?.orgName || 'Atelier Principal';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const totalRev = data?.revenue?.total || 0;
  const paidRev = data?.revenue?.paid || 0;
  const collectionRatio = totalRev > 0 ? Math.round((paidRev / totalRev) * 100) : 100;

  const totalParts = data?.totalParts || 0;
  const lowStock = data?.lowStockCount || 0;
  const stockHealthRatio = totalParts > 0 ? Math.max(0, Math.round(((totalParts - lowStock) / totalParts) * 100)) : 100;

  const activeVehicles = data?.activeVehicles || 0;
  const totalVehicles = data?.totalVehicles || 0;
  const bayCapacityRatio = totalVehicles > 0 ? Math.min(100, Math.round((activeVehicles / Math.max(totalVehicles, 10)) * 100)) : 0;

  return (
    <div className="space-y-8 font-sans max-w-7xl">
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
              {orgName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Supervisez les flux de réparation, la traçabilité des cartes PVC connectées et les extensions de l'écosystème.
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
              href="/admin/actions/new"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex flex-col items-center justify-center text-center gap-1.5"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              <span>Ouvrir un OR</span>
            </Link>

            <Link
              href="/admin/apps"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex flex-col items-center justify-center text-center gap-1.5"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>App Store</span>
            </Link>

            <Link
              href="/admin/settings/api"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700 flex flex-col items-center justify-center text-center gap-1.5"
            >
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Clés d'API REST</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Telemetry Radial Gauges & KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gauge 1: Taux de Recouvrement Financier */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recouvrement Financier</span>
            <div className="font-mono text-2xl font-black text-slate-100">
              {collectionRatio}%
            </div>
            <p className="text-xs text-slate-500">
              {paidRev.toLocaleString('fr-FR')} DA encaissés sur {totalRev.toLocaleString('fr-FR')} DA
            </p>
          </div>

          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${collectionRatio}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-slate-300">{collectionRatio}%</span>
          </div>
        </div>

        {/* Gauge 2: Santé & Disponibilité du Stock */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Santé du Stock Pièces</span>
            <div className="font-mono text-2xl font-black text-slate-100">
              {stockHealthRatio}%
            </div>
            <p className="text-xs text-slate-500">
              {lowStock > 0 ? `${lowStock} pièces sous seuil critique` : 'Niveau de stock optimal'}
            </p>
          </div>

          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${lowStock > 0 ? 'text-amber-500' : 'text-blue-500'} transition-all duration-1000 ease-out`}
                strokeDasharray={`${stockHealthRatio}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-slate-300">{stockHealthRatio}%</span>
          </div>
        </div>

        {/* Gauge 3: Activité & Passeports PVC */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Passeports PVC Actifs</span>
            <div className="font-mono text-2xl font-black text-slate-100">
              {data?.cardsData?.active || 0}
            </div>
            <p className="text-xs text-slate-500">
              {data?.cardsData?.available || 0} cartes prêtes en stock atelier
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Developer & Integration Ecosystem Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Écosystème & Connectivité Logicielle</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                Shopify-Class API
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {data?.developerStats?.installedAppsCount || 0} extension(s) installée(s) • {data?.developerStats?.activeApiKeysCount || 0} clé(s) API active(s) • {data?.developerStats?.activeWebhooksCount || 0} webhook(s) temps réel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/apps"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
          >
            Explorer le Store
          </Link>
          <Link
            href="/admin/settings/api"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl transition"
          >
            Gérer mes Clés
          </Link>
        </div>
      </div>

      {/* 4. Live Workshop Pipeline (Kanban Ribbon) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Pipeline & Flux d'Atelier en Direct
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Progression des véhicules à travers les étapes de travail</p>
          </div>

          <Link href="/admin/actions" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
            Consulter les Ordres de Réparation
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">1. Réception</span>
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div className="font-mono text-2xl font-black text-slate-100">{data?.pipeline?.reception || 0}</div>
            <p className="text-[11px] text-slate-500">En attente de diagnostic</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">2. En Réparation</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="font-mono text-2xl font-black text-slate-100">{data?.pipeline?.inProgress || 0}</div>
            <p className="text-[11px] text-slate-500">Sur le pont / En cours</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">3. Contrôle Qualité</span>
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            </div>
            <div className="font-mono text-2xl font-black text-slate-100">{data?.pipeline?.qualityCheck || 0}</div>
            <p className="text-[11px] text-slate-500">Travaux finalisés</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">4. Prêt à Livrer</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-mono text-2xl font-black text-slate-100">{data?.pipeline?.readyToDeliver || 0}</div>
            <p className="text-[11px] text-slate-500">Facturé & Prêt</p>
          </div>
        </div>
      </div>

      {/* 5. Bottom Telemetry Grid: Recent Jobs & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs List */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Derniers Ordres de Réparation
            </h2>
            <Link href="/admin/actions" className="text-xs text-slate-400 hover:text-slate-200">
              Voir tout
            </Link>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : !data?.recentJobs || data.recentJobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">Aucun ordre de réparation récent</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {data.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/admin/actions/${job.id}`}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-slate-800/40 px-2 rounded-xl transition group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-200 group-hover:text-blue-400 transition-colors">
                        {job.make} {job.model}
                      </span>
                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">
                        {job.plate_number}
                      </code>
                    </div>
                    <p className="text-[11px] text-slate-400 capitalize">{job.type}</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {job.status}
                    </span>
                    <p className="text-[10px] text-slate-500">
                      {new Date(job.date_in).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Team Leaderboard */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Techniciens Leaders
          </h2>

          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
            </div>
          ) : !data?.leaderboard || data.leaderboard.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">Aucune activité enregistrée</div>
          ) : (
            <div className="space-y-3">
              {data.leaderboard.map((worker, i) => (
                <div key={worker.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{worker.full_name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{worker.role}</p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {worker.job_count} OR
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
