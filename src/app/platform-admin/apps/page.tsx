'use client';

import React, { useState, useEffect } from 'react';

interface PlatformApp {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  visibility: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'published' | 'suspended';
  requestedScopes: string[];
  rejectionReason: string | null;
  webhookCallbackUrl: string | null;
  reviewedAt: string | null;
  reviewerName: string | null;
  createdAt: string;
  developer: {
    name: string;
    email: string;
    website: string | null;
  };
  activeInstallsCount: number;
}

export default function PlatformAdminAppsPage() {
  const [apps, setApps] = useState<PlatformApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<PlatformApp | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/platform-admin/apps?status=${statusFilter}`);
      if (!res.ok) throw new Error('Impossible de charger les applications');
      const data = await res.json();
      setApps(data.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [statusFilter]);

  const handleReview = async (appId: string, decision: 'approve' | 'reject' | 'suspend', reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/platform-admin/apps/${appId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason: reason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors de l\'examen');
      }

      setRejectionModalOpen(false);
      setSelectedApp(null);
      fetchApps();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Publiée & Active</span>;
      case 'submitted':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">En Examen</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">Refusée</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-900/40 text-red-300 border border-red-700">Suspendue</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-8 space-y-8 font-sans max-w-7xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Gouvernance & Écosystème
        </div>
        <h1 className="text-2xl font-black text-slate-100 tracking-tight">
          Modération App Store & Extensions Tierces
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Validez les nouvelles intégrations avant leur publication sur le store ou suspendez en urgence les applications suspectes.
        </p>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'all', label: 'Toutes les Applications' },
          { id: 'submitted', label: 'En Attente d’Examen' },
          { id: 'published', label: 'Publiées & Actives' },
          { id: 'rejected', label: 'Refusées' },
          { id: 'suspended', label: 'Suspendues' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === f.id
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Apps Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : apps.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-slate-300 font-bold text-sm">Aucune application dans cette catégorie</p>
            <p className="text-slate-500 text-xs">Les nouvelles soumissions de développeurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {apps.map((app) => (
              <div key={app.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-slate-800/30 transition-colors">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-base font-black text-slate-100">{app.name}</span>
                    <code className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                      {app.slug}
                    </code>
                    {getStatusBadge(app.status)}
                    <span className="text-xs text-slate-400">
                      {app.activeInstallsCount} installation(s) active(s)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{app.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500">Développeur:</span>{' '}
                      <span className="font-bold text-slate-200">{app.developer.name}</span> ({app.developer.email})
                    </div>
                    {app.webhookCallbackUrl && (
                      <div>
                        <span className="text-slate-500">Webhook:</span>{' '}
                        <code className="text-[11px] text-purple-400 font-mono">{app.webhookCallbackUrl}</code>
                      </div>
                    )}
                  </div>

                  {app.rejectionReason && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                      <span className="font-bold">Motif du refus :</span> {app.rejectionReason}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {app.requestedScopes.map((s) => (
                      <span
                        key={s}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          s === 'read_clients'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Review Action Controls */}
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  {app.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleReview(app.id, 'approve')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Approuver & Publier
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setRejectionReason('');
                          setRejectionModalOpen(true);
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-colors"
                      >
                        Refuser...
                      </button>
                    </>
                  )}

                  {app.status === 'published' && (
                    <button
                      onClick={() => {
                        if (confirm(`SUSPENDRE "${app.name}" ? Toutes les clés API générées pour les garages installés seront immédiatement invalidées.`)) {
                          handleReview(app.id, 'suspend');
                        }
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition-colors"
                    >
                      Suspendre l'Application
                    </button>
                  )}

                  {app.status === 'suspended' && (
                    <button
                      onClick={() => handleReview(app.id, 'approve')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl transition-colors"
                    >
                      Réactiver & Publier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Refuser la soumission de {selectedApp.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Veuillez formuler un motif constructif qui sera communiqué au développeur.
              </p>
            </div>

            <textarea
              required
              rows={4}
              placeholder="Ex: Permissions excessives demandées pour les fonctionnalités décrites, URL de webhook invalide..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-red-500 transition-colors"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReview(selectedApp.id, 'reject', rejectionReason)}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all"
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
