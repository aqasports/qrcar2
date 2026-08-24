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
  { id: 'read_clients', label: 'Lire les données clients (Sensible)', desc: 'Accès aux coordonnées des propriétaires de véhicules' },
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

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette clé d’accès API ? Toutes les applications l’utilisant cesseront immédiatement de fonctionner.')) {
      return;
    }

    try {
      const res = await fetch(`/api/developer/keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec de la révocation');
      fetchKeys();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la révocation');
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Accès Développeur & Clés d'API REST / GraphQL"
        subtitle="Créez et gérez les clés d'authentification pour intégrer votre ERP, CRM ou logiciels tiers avec l'atelier"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Paramètres', href: '/admin/settings' },
          { label: 'Clés d\'API' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/developers/docs" target="_blank">
              <Button variant="secondary" size="sm">
                Documentation API ↗
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setGeneratedToken(null);
                setKeyName('');
                setError('');
                setModalOpen(true);
              }}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Générer une Clé API
            </Button>
          </div>
        }
      />

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Nom du Token</TableHead>
            <TableHead>Préfixe Clé</TableHead>
            <TableHead>Permissions / Scopes</TableHead>
            <TableHead>Dernière Utilisation</TableHead>
            <TableHead>Date Création</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement des clés API..." />
          ) : keys.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucune clé d'API active"
              description="Générez un jeton d'authentification pour connecter des intégrations externes ou l'application mobile atelier."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setGeneratedToken(null);
                    setKeyName('');
                    setError('');
                    setModalOpen(true);
                  }}
                >
                  Générer une Première Clé
                </Button>
              }
            />
          ) : (
            keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-bold text-text-primary">
                  {k.name}
                </TableCell>
                <TableCell>
                  <code className="px-2 py-0.5 rounded bg-surface-base border border-border-subtle font-mono text-xs text-accent">
                    {k.key_prefix}...
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {k.scopes?.map((s) => (
                      <Badge key={s} variant="info" size="sm">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-text-muted">
                  {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString('fr-FR') : 'Jamais'}
                </TableCell>
                <TableCell className="text-text-muted text-xs whitespace-nowrap">
                  {new Date(k.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="danger" size="sm" onClick={() => handleRevokeKey(k.id)}>
                    Révoquer
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Key Generation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={generatedToken ? 'Votre Clé d’API a été Générée !' : 'Créer une Nouvelle Clé d’API Atelier'}
        description={generatedToken ? 'Copiez ce jeton immédiatement. Pour des raisons de sécurité, il ne pourra plus être réaffiché.' : 'Définissez le nom et les autorisations de lecture / écriture du jeton d’accès.'}
        size="lg"
      >
        {generatedToken ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-base border border-border-default flex items-center justify-between gap-3">
              <code className="font-mono text-xs text-accent break-all select-all font-bold">
                {generatedToken}
              </code>
              <Button variant="primary" size="sm" onClick={handleCopyToken}>
                {copied ? 'Copié !' : 'Copier'}
              </Button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              Conservez cette clé dans un endroit sécurisé (variables d&apos;environnement, coffre-fort de mots de passe).
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateKey} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
                {error}
              </div>
            )}

            <Input
              label="Nom de l'Intégration / Clé"
              required
              placeholder="ex. Connecteur Comptabilité Sage ou App Mobile Tablette"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
            />

            <div className="space-y-2">
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                Permissions Accordées (Scopes)
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {AVAILABLE_SCOPES.map((sc) => {
                  const isChecked = selectedScopes.includes(sc.id);
                  return (
                    <label
                      key={sc.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-accent/10 border-accent'
                          : 'bg-surface-base border-border-subtle hover:border-border-default'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleScope(sc.id)}
                        className="mt-0.5 w-4 h-4 rounded text-accent"
                      />
                      <div>
                        <span className="text-xs font-bold text-text-primary block">{sc.label}</span>
                        <span className="text-[11px] text-text-muted block mt-0.5">{sc.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button type="submit" isLoading={creating} className="flex-1">
                Générer la Clé Sécurisée
              </Button>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">
                Annuler
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
