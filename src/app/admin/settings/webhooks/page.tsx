'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableLoadingState,
  TableEmptyState,
  Badge,
  Button,
  Input,
  Modal,
} from '@/components/ui';

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
      if (!res.ok) throw new Error(data.error || 'Erreur');

      setRevealedSecret(data.subscription?.secret || 'whsec_generated');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/webhooks/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (!confirm('Supprimer définitivement cet abonnement webhook ?')) return;
    try {
      await fetch(`/api/webhooks/subscriptions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetryDelivery = async (id: string) => {
    try {
      setRetryingId(id);
      await fetch(`/api/webhooks/deliveries/${id}/retry`, { method: 'POST' });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success">Livré (200 OK)</Badge>;
      case 'pending':
        return <Badge variant="warning" pulse>En attente</Badge>;
      case 'failed':
        return <Badge variant="danger">Échec</Badge>;
      case 'exhausted':
        return <Badge variant="neutral">Épuisé (Max Retry)</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Webhooks Sortants & Événements Temps Réel"
        subtitle="Recevez des payloads JSON signés HMAC-SHA256 sur votre serveur à chaque réparation, entrée véhicule ou alerte stock"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Paramètres', href: '/admin/settings' },
          { label: 'Webhooks' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setRevealedSecret(null);
              setTargetUrl('');
              setCreateModalOpen(true);
            }}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Nouvel Endpoint Webhook
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'subscriptions'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Abonnements ({subscriptions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('deliveries')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'deliveries'
              ? 'border-accent text-white'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Journal des Livraisons ({deliveries.length})
        </button>
      </div>

      {activeTab === 'subscriptions' ? (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>URL de Destination</TableHead>
              <TableHead>Événements Écoutés</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingState colSpan={5} message="Chargement des abonnements webhooks..." />
            ) : subscriptions.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                title="Aucun webhook configuré"
                description="Enregistrez une URL HTTPS pour notifier vos applications externes en temps réel."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setRevealedSecret(null);
                      setTargetUrl('');
                      setCreateModalOpen(true);
                    }}
                  >
                    Ajouter un Premier Webhook
                  </Button>
                }
              />
            ) : (
              subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-bold text-text-primary">
                    {s.targetUrl}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.topics?.map((t) => (
                        <Badge key={t} variant="info" size="sm">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.active ? 'success' : 'neutral'}>
                      {s.active ? 'Actif' : 'En Pause'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-text-muted text-xs whitespace-nowrap">
                    {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleActive(s.id, s.active)}
                      >
                        {s.active ? 'Pause' : 'Activer'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSub(s.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Date / Heure</TableHead>
              <TableHead>Événement</TableHead>
              <TableHead>Statut Livraison</TableHead>
              <TableHead className="text-right">Code HTTP</TableHead>
              <TableHead className="text-right">Tentatives</TableHead>
              <TableHead className="text-right">Détails</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingState colSpan={6} message="Chargement des livraisons..." />
            ) : deliveries.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                title="Aucune livraison enregistrée"
                description="Le journal des événements envoyés apparaîtra ici au fil des opérations d'atelier."
              />
            ) : (
              deliveries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs text-text-muted whitespace-nowrap">
                    {new Date(d.createdAt).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-accent text-xs">
                    {d.topic}
                  </TableCell>
                  <TableCell>{getDeliveryBadge(d.status)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs">
                    {d.responseStatus || '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {d.attempts} / 5
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {d.status !== 'delivered' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={retryingId === d.id}
                          onClick={() => handleRetryDelivery(d.id)}
                        >
                          Rejouer
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectDelivery(d)}
                      >
                        Inspecter
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Creation Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={revealedSecret ? 'Webhook Enregistré !' : 'Nouvel Endpoint Webhook'}
        description={revealedSecret ? 'Copiez immédiatement le secret HMAC. Il vous permettra de vérifier la signature des requêtes.' : 'Indiquez l’URL HTTPS de votre serveur qui recevra les notifications JSON.'}
        size="lg"
      >
        {revealedSecret ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-base border border-border-default space-y-2">
              <span className="text-[10px] uppercase font-bold text-text-muted block">Secret de Signature HMAC (whsec_...)</span>
              <code className="font-mono text-xs text-emerald-400 break-all select-all font-bold block">
                {revealedSecret}
              </code>
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateSubscription} className="space-y-4">
            <Input
              label="URL de Destination HTTPS"
              required
              placeholder="https://api.monserveur.dz/webhooks/qrcar"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="font-mono"
            />

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Événements Déclencheurs
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AVAILABLE_TOPICS.map((t) => {
                  const isChecked = selectedTopics.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-accent/10 border-accent'
                          : 'bg-surface-base border-border-subtle hover:border-border-default'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedTopics(selectedTopics.filter((x) => x !== t.id));
                          } else {
                            setSelectedTopics([...selectedTopics, t.id]);
                          }
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-accent"
                      />
                      <div>
                        <span className="text-xs font-mono font-bold text-text-primary block">{t.label}</span>
                        <span className="text-[10px] text-text-muted block mt-0.5">{t.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button type="submit" isLoading={creating} className="flex-1">
                Créer l&apos;Abonnement
              </Button>
              <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)} className="flex-1">
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Inspect Modal */}
      <Modal
        isOpen={Boolean(inspectDelivery)}
        onClose={() => setInspectDelivery(null)}
        title="Détails du Payload Webhook"
        description={inspectDelivery ? `Événement ${inspectDelivery.topic} (${inspectDelivery.eventId})` : ''}
        size="lg"
      >
        {inspectDelivery && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block mb-1">
                Payload JSON Transmis
              </span>
              <pre className="p-4 rounded-xl bg-surface-base border border-border-subtle text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
                {JSON.stringify(inspectDelivery.payload, null, 2)}
              </pre>
            </div>

            {inspectDelivery.errorMessage && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-mono">
                Erreur serveur : {inspectDelivery.errorMessage}
              </div>
            )}

            <div className="flex justify-end pt-3">
              <Button variant="secondary" onClick={() => setInspectDelivery(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
