'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
  app_name: string;
}

const AVAILABLE_SCOPES = [
  { id: 'read_vehicles', label: 'Lire les véhicules', desc: 'Consulter la liste et les fiches détaillées des véhicules' },
  { id: 'write_vehicles', label: 'Écrire / Mettre à jour véhicules', desc: 'Ajouter ou modifier des véhicules et kilométrages' },
  { id: 'read_actions', label: 'Lire les interventions (OR)', desc: 'Consulter les ordres de réparation et historiques' },
  { id: 'write_actions', label: 'Créer / Clôturer interventions', desc: 'Ouvrir de nouveaux OR et déduire les pièces du stock' },
  { id: 'read_inventory', label: 'Lire le stock de pièces', desc: 'Consulter le catalogue et les niveaux de stock' },
  { id: 'write_inventory', label: 'Ajuster le stock', desc: 'Modifier les quantités en stock et enregistrer les mouvements' },
  { id: 'read_invoices', label: 'Lire les factures', desc: 'Consulter les montants, totaux et statuts des factures' },
  { id: 'manage_webhooks', label: 'Gérer les abonnements webhooks', desc: 'Enregistrer des URLs de rappel pour les notifications en temps réel' },
  { id: 'read_clients', label: 'Lire les données clients (Données Sensibles)', desc: 'Accès aux noms, numéros de téléphone et adresses des clients', isSensitive: true },
];

export default function ApiSettingsPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'read_vehicles',
    'read_actions',
    'read_inventory',
  ]);
  const [creating, setCreating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/developer/keys');
      if (!res.ok) throw new Error('Impossible de charger les clés API');
      const data = await res.json();
      setKeys(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des clés API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleToggleScope = (scopeId: string) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyName.trim(),
          scopes: selectedScopes,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erreur lors de la création de la clé');
      }

      const resData = await res.json();
      setGeneratedToken(resData.data.rawToken);
      fetchKeys();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous certain de vouloir révoquer la clé API "${name}" ? Cette action est irréversible et bloquera immédiatement les applications connectées.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/developer/keys/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erreur lors de la révocation');
      fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la révocation de la clé');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl">
      {/* Navigation Breadcrumb / Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <Link
          href="/admin/settings"
          className="text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          Général & Identité
        </Link>
        <div className="h-4 w-px bg-slate-700"></div>
        <span className="text-sm font-semibold text-blue-400 border-b-2 border-blue-500 pb-4 -mb-4">
          Développeur & API REST
        </span>
        <div className="h-4 w-px bg-slate-700"></div>
        <Link
          href="/admin/settings/webhooks"
          className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors pb-4 -mb-4"
        >
          Webhooks & Événements
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Développeur & Clés d'API
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connectez vos logiciels comptables, ERP de pièces, applications tierces et outils personnalisés via l'API REST v1 sécurisée.
          </p>
        </div>

        <button
          onClick={() => {
            setKeyName('');
            setGeneratedToken(null);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Générer une clé API
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Quickstart Developer Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Démarrage Rapide API REST v1</h2>
              <p className="text-xs text-slate-400">Authentification via en-tête Bearer standard et données isolées par RLS.</p>
            </div>
          </div>

          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
            Endpoint Base: /api/public/v1
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto relative">
          <p className="text-slate-500 mb-1"># Tester votre authentification et consulter vos quotas:</p>
          <pre className="text-blue-300">curl -X GET https://qrcar.pro/api/public/v1/me \
  -H "Authorization: Bearer qrc_live_VOTRE_CLE_API"</pre>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Clés d'API Actives ({keys.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-slate-300 font-bold text-sm">Aucune clé API active</p>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              Créez votre première clé pour connecter un script de synchronisation ou un logiciel externe.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {keys.map((k) => (
              <div key={k.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-200 text-sm">{k.name}</span>
                    <code className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-xs border border-slate-700">
                      {k.key_prefix}...
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Array.isArray(k.scopes) && k.scopes.map((s) => (
                      <span
                        key={s}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          s === 'read_clients'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Créée le {new Date(k.created_at).toLocaleDateString('fr-FR')} •{' '}
                    {k.last_used_at
                      ? `Dernière utilisation le ${new Date(k.last_used_at).toLocaleDateString('fr-FR')} à ${new Date(k.last_used_at).toLocaleTimeString('fr-FR')}`
                      : 'Jamais utilisée'}
                  </p>
                </div>

                <button
                  onClick={() => handleRevokeKey(k.id, k.name)}
                  className="px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors self-start md:self-center flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Révoquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            {!generatedToken ? (
              <form onSubmit={handleCreateKey} className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Générer une nouvelle clé d'API
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Définissez un nom mémorable et sélectionnez uniquement les permissions strictement nécessaires.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nom de la clé / Application</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Synchronisation Comptabilité, App Mobile Interne..."
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Permissions & Portées (Scopes)</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {AVAILABLE_SCOPES.map((scope) => {
                      const checked = selectedScopes.includes(scope.id);
                      return (
                        <div
                          key={scope.id}
                          onClick={() => handleToggleScope(scope.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            checked
                              ? scope.isSensitive
                                ? 'bg-amber-500/10 border-amber-500/30'
                                : 'bg-blue-500/10 border-blue-500/30'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="mt-1 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{scope.label}</span>
                              <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                {scope.id}
                              </code>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{scope.desc}</p>
                            {scope.isSensitive && checked && (
                              <p className="text-[10px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Attention: Cet accès révèle l'identité et les coordonnées des clients.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !keyName.trim() || selectedScopes.length === 0}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                  >
                    {creating ? 'Génération en cours...' : 'Créer la clé API'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">Clé d'API Générée avec Succès</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Copiez cette clé maintenant. Pour des raisons strictes de sécurité cryptographique, elle ne sera plus jamais affichée.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase">Clé Secrète</span>
                    <button
                      onClick={() => copyToClipboard(generatedToken)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copied ? 'Copié dans le presse-papiers !' : 'Copier la clé'}
                    </button>
                  </div>
                  <div className="font-mono text-sm text-emerald-400 break-all select-all bg-slate-900 p-3 rounded-lg border border-slate-800">
                    {generatedToken}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Stockez cette clé dans vos variables d'environnement de manière sécurisée. Ne la committez jamais dans un dépôt public.
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setGeneratedToken(null);
                      setModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-colors"
                  >
                    J'ai sauvegardé ma clé
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
