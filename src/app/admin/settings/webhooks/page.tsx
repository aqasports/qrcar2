'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface WebhookSubscription {
  id: string;
  targetUrl: string;
  topics: string[];
  active: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  targetUrl: string;
  eventId: string;
  topic: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'exhausted';
  attempts: number;
  lastAttemptAt: string | null;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  createdAt: string;
}

const AVAILABLE_TOPICS = [
  { id: 'vehicle.created', label: 'vehicle.created', desc: 'Nouvelle immatriculation ou fiche véhicule créée' },
  { id: 'action.created', label: 'action.created', desc: 'Nouvel ordre de réparation (OR) ouvert' },
  { id: 'action.completed', label: 'action.completed', desc: 'Intervention mécanique validée & terminée' },
  { id: 'stock.low', label: 'stock.low', desc: 'Alerte stock pièce sous le seuil critique' },
  { id: 'invoice.issued', label: 'invoice.issued', desc: 'Facture ou devis finalisé' },
  { id: 'appointment.created', label: 'appointment.created', desc: 'Prise de rendez-vous en ligne par un client' },
];

export default function WebhooksSettingsPage() {
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'deliveries'>('subscriptions');

  // Creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['action.completed', 'stock.low']);
  const [creating, setCreating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  // Payload inspect modal
  const [inspectDelivery, setInspectDelivery] = useState<WebhookDelivery | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, delRes] = await Promise.all([
        fetch('/api/webhooks/subscriptions'),
        fetch('/api/webhooks/deliveries'),
      ]);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriptions(subData.subscriptions || []);
      }
      if (delRes.ok) {
        const delData = await delRes.json();
        setDeliveries(delData.deliveries || []);
      }
    } catch (err) {
      console.error('Failed to load webhook data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.startsWith('https://')) {
      alert('L\'URL doit impérativement débuter par https://');
      return;
    }
    if (selectedTopics.length === 0) {
      alert('Veuillez sélectionner au moins un événement');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/webhooks/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: targetUrl,
          topics: selectedTopics,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');

      setRevealedSecret(data.subscription.signingSecret);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Supprimer définitivement cet abonnement webhook ?')) return;

    try {
      const res = await fetch(`/api/webhooks/subscriptions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    try {
      const res = await fetch(`/api/webhooks/deliveries/${deliveryId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec de la relivraison');
      alert(`Statut de rediffusion : ${data.status} (Code HTTP: ${data.responseStatus || 'N/A'})`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const toggleTopic = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topicId));
    } else {
      setSelectedTopics([...selectedTopics, topicId]);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Événements & Temps Réel
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Webhooks & Dispatches Outbound
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configurez des récepteurs HTTPS sécurisés par signature HMAC-SHA256 pour synchroniser vos serveurs tiers en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings/api"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-slate-700"
          >
            &larr; Clés d'API REST
          </Link>
          <button
            onClick={() => {
              setRevealedSecret(null);
              setTargetUrl('');
              setSelectedTopics(['action.completed', 'stock.low']);
              setCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un Webhook
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'subscriptions'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Abonnements Actifs ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'deliveries'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          Journal des Livraisons ({deliveries.length})
        </button>
      </div>

      {/* Tab 1: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="text-slate-300 font-bold text-sm">Aucun abonnement webhook configuré</p>
              <p className="text-slate-500 text-xs">Ajoutez une URL HTTPS de réception pour être notifié des événements d'atelier.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <code className="text-xs font-mono font-bold text-purple-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        {sub.targetUrl}
                      </code>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Actif
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.topics.map((t) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono">
                      Créé le {new Date(sub.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteSubscription(sub.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition self-start md:self-auto"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Deliveries Log */}
      {activeTab === 'deliveries' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <p className="text-slate-300 font-bold text-sm">Aucune tentative de livraison enregistrée</p>
              <p className="text-slate-500 text-xs">Les futurs dispatches d'événements apparaîtront ici avec leur code HTTP de retour.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {deliveries.map((del) => (
                <div key={del.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/20 transition">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        del.status === 'delivered'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : del.status === 'failed'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {del.status}
                      </span>

                      <code className="text-xs font-mono font-bold text-slate-200">
                        {del.topic}
                      </code>

                      <span className="text-xs text-slate-400 font-mono">
                        HTTP {del.responseStatus || '---'}
                      </span>

                      <span className="text-xs text-slate-500">
                        Tentative {del.attempts}/5
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-mono truncate max-w-xl">
                      {del.targetUrl}
                    </p>

                    {del.errorMessage && (
                      <p className="text-[11px] text-red-400 font-mono">
                        Erreur : {del.errorMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setInspectDelivery(del)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition border border-slate-700"
                    >
                      Inspecter Payload
                    </button>
                    {del.status !== 'delivered' && (
                      <button
                        onClick={() => handleRetryDelivery(del.id)}
                        disabled={retryingId === del.id}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
                      >
                        {retryingId === del.id ? 'Relivraison...' : 'Réexpédier'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Configurer un Récepteur Webhook Outbound
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Notre passerelle enverra une requête POST signée par HMAC-SHA256 à votre serveur dès qu'un événement survient.
              </p>
            </div>

            {revealedSecret ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                  <p className="font-bold">Secret de Signature (À copier maintenant) :</p>
                  <code className="block p-3 rounded-xl bg-slate-950 font-mono text-xs break-all text-amber-400 border border-slate-800">
                    {revealedSecret}
                  </code>
                  <p className="text-[11px] text-slate-400">
                    Ce secret ne sera plus jamais affiché. Utilisez-le pour vérifier le header <code className="text-purple-300">X-QrCar-Signature</code> sur votre serveur.
                  </p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(revealedSecret);
                    alert('Secret copié dans le presse-papiers');
                    setCreateModalOpen(false);
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition"
                >
                  Copier le Secret & Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubscription} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">URL Endpoint (HTTPS Obligatoire)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.votre-serveur.com/webhooks/qrcar"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">Événements Écoutés (Topics)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {AVAILABLE_TOPICS.map((topic) => {
                      const isSelected = selectedTopics.includes(topic.id);
                      return (
                        <div
                          key={topic.id}
                          onClick={() => toggleTopic(topic.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                            isSelected
                              ? 'bg-purple-500/10 border-purple-500/40 text-slate-100'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-purple-600 focus:ring-0"
                          />
                          <div>
                            <p className="text-xs font-mono font-bold text-slate-200">{topic.label}</p>
                            <p className="text-[11px] text-slate-400">{topic.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/20"
                  >
                    {creating ? 'Génération...' : 'Créer le Webhook'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Inspect Payload Modal */}
      {inspectDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                Détails du Dispatch : {inspectDelivery.topic}
              </h3>
              <button
                onClick={() => setInspectDelivery(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                Fermer &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-500 font-mono">Payload JSON transmis :</span>
                <pre className="mt-1 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto max-h-64">
                  {JSON.stringify(inspectDelivery.payload, null, 2)}
                </pre>
              </div>

              {inspectDelivery.responseBody && (
                <div>
                  <span className="text-[11px] text-slate-500 font-mono">Réponse reçue du serveur distant :</span>
                  <pre className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-32">
                    {inspectDelivery.responseBody}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
