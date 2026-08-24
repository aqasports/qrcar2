'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Input,
  Textarea,
  Modal,
  Spinner,
  EmptyState,
} from '@/components/ui';

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
  read_clients: { label: 'Accès aux coordonnées clients (Sensible)', isSensitive: true },
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

  const handleUninstall = async (appId: string, name: string) => {
    if (!confirm(`Désinstaller l'application ${name} ? Son accès à vos données sera immédiatement révoqué.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/apps/${appId}/uninstall`, { method: 'POST' });
      if (!res.ok) throw new Error('Erreur de désinstallation');
      fetchApps();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  };

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;

    setSubmittingApp(true);
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: appName.trim(),
          description: appDescription.trim(),
          webhook_url: appWebhookUrl.trim() || null,
          requested_scopes: appScopes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }

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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="App Store & Écosystème Connecté"
        subtitle="Connectez votre atelier à des intégrations certifiées : modules de comptabilité, SMS de relance, logiciels de diagnostic et passerelles tierces"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'App Store' },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/developers/docs" target="_blank">
              <Button variant="secondary" size="sm">
                Docs Développeurs ↗
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSubmitModalOpen(true)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Publier une Application
            </Button>
          </div>
        }
      />

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
          <button
            type="button"
            onClick={() => setTab('store')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              tab === 'store'
                ? 'border-accent text-white'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Catalogue Public
          </button>
          <button
            type="button"
            onClick={() => setTab('installed')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              tab === 'installed'
                ? 'border-accent text-white'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Applications Installées ({apps.filter((a) => a.isInstalled).length})
          </button>
        </div>

        <div className="max-w-xs w-full">
          <Input
            placeholder="Rechercher une application..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Chargement du catalogue d&apos;applications...</p>
        </div>
      ) : apps.length === 0 ? (
        <EmptyState
          title="Aucune application disponible"
          description="Aucune application ne correspond à votre filtre actuel."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <Card key={app.id} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-base border border-border-subtle flex items-center justify-center font-black text-accent text-base shrink-0">
                      {app.name.charAt(0)}
                    </div>
                    <div>
                      {app.isInstalled ? (
                        <Badge variant="success">Installée</Badge>
                      ) : (
                        <Badge variant="info">Certifiée</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-3">{app.name}</CardTitle>
                  <CardDescription>Par {app.developer?.name || 'Développeur Tiers'}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    {app.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-border-subtle">
                    <span className="text-[10px] uppercase font-bold text-text-muted block">Permissions requises</span>
                    <div className="flex flex-wrap gap-1">
                      {app.requestedScopes?.map((sc) => (
                        <Badge key={sc} variant="neutral" size="sm">
                          {sc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-border-subtle">
                {app.isInstalled ? (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => handleUninstall(app.id, app.name)}
                  >
                    Désinstaller
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedAppForInstall(app);
                      setInstalledSuccess(false);
                      setNewKey(null);
                    }}
                  >
                    Installer dans l&apos;Atelier
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Permission Consent / Install Modal */}
      <Modal
        isOpen={Boolean(selectedAppForInstall)}
        onClose={() => setSelectedAppForInstall(null)}
        title={installedSuccess ? 'Application Installée !' : `Autoriser ${selectedAppForInstall?.name}`}
        description={installedSuccess ? 'L’intégration a été autorisée avec succès dans votre atelier.' : 'Cette application demande l’accès aux modules suivants pour fonctionner :'}
        size="lg"
      >
        {installedSuccess ? (
          <div className="space-y-4">
            {newKey && (
              <div className="p-4 rounded-xl bg-surface-base border border-border-default space-y-2">
                <span className="text-[10px] uppercase font-bold text-text-muted block">Jeton Dédié Généré pour l&apos;App</span>
                <code className="font-mono text-xs text-emerald-400 break-all select-all font-bold block">
                  {newKey}
                </code>
              </div>
            )}
            <div className="flex justify-end pt-3">
              <Button variant="secondary" onClick={() => setSelectedAppForInstall(null)}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedAppForInstall?.requestedScopes?.map((sc) => {
                const info = SCOPE_LABELS[sc] || { label: sc };
                return (
                  <div
                    key={sc}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      info.isSensitive
                        ? 'bg-danger/10 border-danger/25 text-danger'
                        : 'bg-surface-base border-border-subtle text-text-primary'
                    }`}
                  >
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-semibold">{info.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button
                type="button"
                isLoading={installing}
                onClick={() => selectedAppForInstall && handleInstall(selectedAppForInstall)}
                className="flex-1"
              >
                Confirmer & Autoriser l&apos;Accès
              </Button>
              <Button type="button" variant="secondary" onClick={() => setSelectedAppForInstall(null)} className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Developer App Submission Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Créer une Application Développeur"
        description="Enregistrez une nouvelle intégration pour la distribuer sur l'App Store ou la connecter à votre atelier."
      >
        <form onSubmit={handleRegisterApp} className="space-y-4">
          <Input
            label="Nom de l'Application"
            required
            placeholder="ex. Connecteur ERP Aladin"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
          />

          <Textarea
            label="Description des Fonctionnalités"
            required
            rows={3}
            placeholder="Expliquez ce que fait l'application..."
            value={appDescription}
            onChange={(e) => setAppDescription(e.target.value)}
          />

          <Input
            label="URL Webhook Événements (Optionnel)"
            placeholder="https://mon-app.com/webhooks"
            value={appWebhookUrl}
            onChange={(e) => setAppWebhookUrl(e.target.value)}
            className="font-mono"
          />

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={submittingApp} className="flex-1">
              Enregistrer l&apos;Application
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSubmitModalOpen(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
