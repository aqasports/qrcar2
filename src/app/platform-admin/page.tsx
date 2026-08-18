'use client';

import React, { useEffect, useState } from 'react';

export default function PlatformAdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/platform-admin/organizations');
      if (!res.ok) throw new Error('Impossible de charger les données plateforme.');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleUpdateOrg = async (orgId: string, updates: any) => {
    try {
      setActionLoadingId(orgId);
      const res = await fetch(`/api/platform-admin/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Échec de la modification.');
      }

      await fetchOrganizations();
      setSelectedOrg(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalGarages: 0,
    activeCount: 0,
    trialingCount: 0,
    pastDueCount: 0,
    totalMRR: 0,
    totalVehicles: 0,
    totalActions: 0,
  };

  const organizations = (data?.organizations || []).filter((org: any) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || org.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
          <span>Supervision des Garages & Abonnements</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase">
            Ops Level 1
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Vue d&apos;ensemble de tous les locataires, abonnements Chargily Pay (BaridiMob), quotas et gestion administrative.
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Garages</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-black text-slate-100 mt-3">{metrics.totalGarages}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-bold">{metrics.activeCount} Actifs</span>
            <span>•</span>
            <span className="text-blue-400 font-bold">{metrics.trialingCount} En essai</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenu Mensuel (MRR)</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-3">
            {metrics.totalMRR.toLocaleString('fr-FR')} <span className="text-sm font-normal text-slate-400">DZD</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">Souscriptions BaridiMob / EDAHABIA</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Véhicules Enregistrés</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-black text-slate-100 mt-3">{metrics.totalVehicles}</p>
          <p className="text-xs text-slate-400 mt-2">Cartes d&apos;identité PVC actives</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interventions Atelier</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </span>
          </div>
          <p className="text-3xl font-black text-slate-100 mt-3">{metrics.totalActions}</p>
          <p className="text-xs text-slate-400 mt-2">Traçabilité & réparations</p>
        </div>
      </div>

      {/* Organizations Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-100">Liste des Ateliers Enregistrés ({organizations.length})</h3>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Rechercher par nom ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition w-full sm:w-64"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="trialing">En Essai</option>
              <option value="past_due">En Retard / Expiré</option>
              <option value="canceled">Suspendu</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Atelier / Garage</th>
                <th className="py-3 px-4">Forfait</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Utilisateurs</th>
                <th className="py-3 px-4">Véhicules</th>
                <th className="py-3 px-4">Échéance / Essai</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {organizations.map((org: any) => (
                <tr key={org.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{org.name}</div>
                    <div className="text-[11px] font-mono text-slate-500">/{org.slug}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-200">{org.plan_name || 'Pro'}</span>
                    <div className="text-[10px] text-amber-400">{parseFloat(org.price_monthly || '0').toLocaleString('fr-FR')} DZD/m</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        org.subscription_status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : org.subscription_status === 'trialing'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {org.subscription_status === 'trialing' ? 'Essai' : org.subscription_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{org.members_count || 1}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{org.vehicles_count || 0}</td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {org.subscription_status === 'trialing' && org.trial_ends_at
                      ? `Essai: ${new Date(org.trial_ends_at).toLocaleDateString('fr-FR')}`
                      : org.current_period_ends_at
                      ? `Renouv.: ${new Date(org.current_period_ends_at).toLocaleDateString('fr-FR')}`
                      : 'Non planifié'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        Gérer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Organization Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Gérer {selectedOrg.name}</h3>
                <p className="text-xs font-mono text-slate-400">ID: {selectedOrg.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Statut de l&apos;Abonnement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['active', 'trialing', 'past_due'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateOrg(selectedOrg.id, { subscription_status: st })}
                      disabled={actionLoadingId === selectedOrg.id}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition ${
                        selectedOrg.subscription_status === st
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st === 'trialing' ? 'Essai' : st === 'past_due' ? 'En Retard' : 'Actif'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Actions Administratives Rapides
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleUpdateOrg(selectedOrg.id, { extend_trial_days: 14 })}
                    disabled={actionLoadingId === selectedOrg.id}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <span>+ Prolongation Essai Gratuit (+14 jours)</span>
                  </button>

                  <button
                    onClick={() => handleUpdateOrg(selectedOrg.id, { subscription_status: 'active' })}
                    disabled={actionLoadingId === selectedOrg.id}
                    className="w-full py-2.5 px-4 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <span>✓ Activer Manuellement (Paiement Reçu Hors Ligne)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modifier le Forfait
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['starter', 'pro', 'enterprise'].map((slug) => (
                    <button
                      key={slug}
                      onClick={() => handleUpdateOrg(selectedOrg.id, { plan_slug: slug })}
                      disabled={actionLoadingId === selectedOrg.id}
                      className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition ${
                        selectedOrg.plan_slug === slug
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {slug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 flex justify-end">
              <button
                onClick={() => setSelectedOrg(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
