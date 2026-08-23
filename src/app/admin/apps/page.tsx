'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AppItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  status: string;
  requestedScopes: string[];
  createdAt: string;
  developer: {
    name: string;
    email: string;
  };
  isInstalled: boolean;
  install?: {
    id: string;
    status: string;
    grantedScopes: string[];
    installedAt: string;
  } | null;
}

const SCOPE_LABELS: Record<string, { label: string; isSensitive?: boolean }> = {
  read_vehicles: { label: 'Lecture du parc de véhicules' },
  write_vehicles: { label: 'Ajout & modification des véhicules' },
  read_actions: { label: 'Lecture des interventions (OR)' },
  write_actions: { label: 'Création & clôture d\'interventions' },
  read_inventory: { label: 'Consultation du stock de pièces' },
  write_inventory: { label: 'Ajustement du stock de pièces' },
  read_invoices: { label: 'Consultation des factures & montants' },
  manage_webhooks: { label: 'Gestion des abonnements webhooks' },
  read_clients: { label: 'Accès aux coordonnées clients (Noms, Tél, Adresses)', isSensitive: true },
};

export default function GarageAppStorePage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'store' | 'installed'>('store');
  const [selectedAppForInstall, setSelectedAppForInstall] = useState<AppItem | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  // New App Submission Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appWebhookUrl, setAppWebhookUrl] = useState('');
  const [appScopes, setAppScopes] = useState<string[]>(['read_vehicles', 'read_actions']);
  const [submittingApp, setSubmittingApp] = useState(false);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/apps?filter=${tab === 'installed' ? 'installed' : 'all'}&search=${encodeURIComponent(search)}`);
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
  }, [tab, search]);

  const handleInstall = async (app: AppItem) => {
    setInstalling(true);
    try {
      const res = await fetch(`/api/apps/${app.id}/install`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors de l\'installation');
      }

      const resData = await res.json();
      if (resData.data?.rawToken) {
        setNewKey(resData.data.rawToken);
      }
      setInstalledSuccess(true);
      fetchApps();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (appId: string, appName: string) => {
    if (!confirm(`Désinstaller "${appName}" ? Toutes les clés API et webhooks associés seront immédiatement révoqués.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/apps/${appId}/uninstall`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erreur lors de la désinstallation');
      fetchApps();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !appDescription.trim()) return;

    setSubmittingApp(true);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appName.trim(),
          description: appDescription.trim(),
          webhookCallbackUrl: appWebhookUrl.trim() || null,
          requestedScopes: appScopes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors de la soumission');
      }

      alert('Votre application a été soumise pour examen par l\'équipe OKKUL !');
      setSubmitModalOpen(false);
      setAppName('');
      setAppDescription('');
      setAppWebhookUrl('');
      fetchApps();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            App Store & Extensions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enrichissez votre atelier en connectant des applications certifiées : comptabilité, diagnostic avancé, WhatsApp et ERP.
          </p>
        </div>

        <button
          onClick={() => setSubmitModalOpen(true)}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-bold rounded-xl transition-all flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Publier une Application
        </button>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTab('store')}
            className={`text-sm font-bold pb-4 -mb-4 transition-colors flex items-center gap-2 ${
              tab === 'store'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Explorer le Store
          </button>
          <div className="h-4 w-px bg-slate-800"></div>
          <button
            onClick={() => setTab('installed')}
            className={`text-sm font-bold pb-4 -mb-4 transition-colors flex items-center gap-2 ${
              tab === 'installed'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mes Extensions Installées
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher une application..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : apps.length === 0 ? (
        <div className="p-16 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-slate-300 font-bold text-sm">
            {tab === 'installed' ? 'Aucune application installée pour le moment' : 'Aucune application trouvée'}
          </p>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            {tab === 'installed'
              ? 'Explorez le Store pour connecter des outils automatisés à votre atelier.'
              : 'Soyez le premier à publier une intégration via l\'API publique qrCar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    )}
                  </div>

                  {app.isInstalled ? (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Installé
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded-md text-[10px] font-semibold">
                      Officiel
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Par {app.developer.name}</p>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {app.description}
                </p>

                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Permissions requises
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {app.requestedScopes.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          s === 'read_clients'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                    {app.requestedScopes.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{app.requestedScopes.length - 3} autres
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                {app.isInstalled ? (
                  <>
                    <Link
                      href="/admin/settings/api"
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                      Configurer clés
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>

                    <button
                      onClick={() => handleUninstall(app.id, app.name)}
                      className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
                    >
                      Désinstaller
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedAppForInstall(app);
                      setInstalledSuccess(false);
                      setNewKey(null);
                    }}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Installer l'extension
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scope Consent & Installation Modal */}
      {selectedAppForInstall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            {!installedSuccess ? (
              <>
                <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">
                      Installer {selectedAppForInstall.name}
                    </h3>
                    <p className="text-xs text-slate-400">Développé par {selectedAppForInstall.developer.name}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Permissions & Accès aux Données Demandés
                  </h4>
                  <p className="text-xs text-slate-400">
                    En installant cette application, vous autorisez l'accès sécurisé suivant à votre atelier :
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedAppForInstall.requestedScopes.map((scope) => {
                      const meta = SCOPE_LABELS[scope] || { label: scope };
                      return (
                        <div
                          key={scope}
                          className={`p-3 rounded-xl border flex items-start gap-3 ${
                            meta.isSensitive
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold">{meta.label}</p>
                            <code className="text-[10px] text-slate-400 font-mono">{scope}</code>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedAppForInstall.requestedScopes.includes('read_clients') && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Cette application aura accès aux identités et numéros de téléphone de vos clients.</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setSelectedAppForInstall(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleInstall(selectedAppForInstall)}
                    disabled={installing}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20"
                  >
                    {installing ? 'Installation...' : 'Autoriser & Installer'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">Application Installée avec Succès</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedAppForInstall.name} est désormais active et connectée à votre garage.
                  </p>
                </div>

                {newKey && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Clé d'API Générée pour cette extension
                    </span>
                    <div className="font-mono text-xs text-emerald-400 break-all select-all bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      {newKey}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedAppForInstall(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Submission Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <form onSubmit={handleAppSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Soumettre une Application au Store
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Publiez votre solution pour qu'elle soit validée et accessible à tous les garages partenaires qrCar.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nom de l'Application</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Sync Comptable Auto, WhatsApp Reminder Pro..."
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description & Fonctionnalités</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Décrivez comment votre application aide les ateliers mécaniques..."
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">URL Callback Webhook (Optionnel)</label>
                <input
                  type="url"
                  placeholder="https://api.votre-serveur.com/webhooks/qrcar"
                  value={appWebhookUrl}
                  onChange={(e) => setAppWebhookUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingApp || !appName.trim() || !appDescription.trim()}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20"
                >
                  {submittingApp ? 'Envoi en cours...' : 'Soumettre pour examen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
