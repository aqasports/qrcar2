'use client';

import React, { useEffect, useState } from 'react';
import {
  PageHeader,
  StatCard,
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
  Select,
  Modal,
} from '@/components/ui';

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

  const getSubStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Actif</Badge>;
      case 'trialing':
        return <Badge variant="info">Essai Pro</Badge>;
      case 'past_due':
        return <Badge variant="danger" pulse>En Souffrance</Badge>;
      case 'canceled':
        return <Badge variant="neutral">Résilié</Badge>;
      default:
        return <Badge variant="neutral">{status || 'Inactif'}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Supervision de la Plateforme (Multi-Tenancy Ops)"
        subtitle="Contrôle global des ateliers inscrits, des abonnements Chargily Pay, des quotas de flotte et de la conformité"
        breadcrumbs={[
          { label: 'Platform Admin', href: '/platform-admin' },
          { label: 'Ateliers & Abonnements' },
        ]}
        badge={<Badge variant="danger">Super Admin</Badge>}
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Ateliers Inscrits"
          value={metrics.totalGarages}
          subtitle={`${metrics.activeCount} abonnements payants actifs`}
          icon={
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          label="MRR Global Estimé"
          value={`${metrics.totalMRR?.toLocaleString()} DZD`}
          subtitle="Revenu Mensuel Récurrent"
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          label="Véhicules Suivis au Total"
          value={metrics.totalVehicles}
          subtitle={`${metrics.totalActions} ordres de réparation exécutés`}
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <StatCard
          label="Comptes en Souffrance"
          value={metrics.pastDueCount}
          subtitle="Dunning / Retards de paiement"
          badge={metrics.pastDueCount > 0 ? <Badge variant="danger">Attention</Badge> : <Badge variant="success">À jour</Badge>}
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <Input
            placeholder="Rechercher par nom de garage, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-52">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les états</option>
            <option value="active">Abonnements Actifs</option>
            <option value="trialing">Période d&apos;Essai</option>
            <option value="past_due">En Souffrance (Past Due)</option>
            <option value="canceled">Résiliés</option>
          </Select>
        </div>
      </div>

      {/* Organizations Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Atelier / Raison Sociale</TableHead>
            <TableHead>Forfait</TableHead>
            <TableHead>Statut Abonnement</TableHead>
            <TableHead className="text-right">Véhicules</TableHead>
            <TableHead className="text-right">Cartes PVC</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement des ateliers locataires..." />
          ) : organizations.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucun atelier trouvé"
              description="Aucun locataire ne correspond à vos filtres de recherche."
            />
          ) : (
            organizations.map((org: any) => (
              <TableRow key={org.id}>
                <TableCell>
                  <span className="font-bold text-text-primary block">{org.name}</span>
                  <span className="text-xs font-mono text-text-muted block">/{org.slug}</span>
                </TableCell>
                <TableCell className="font-semibold text-text-secondary capitalize">
                  {org.plan_name || 'Starter'}
                </TableCell>
                <TableCell>{getSubStatusBadge(org.subscription_status)}</TableCell>
                <TableCell className="text-right font-mono font-bold text-text-primary">
                  {org.vehicle_count || 0}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-text-primary">
                  {org.pvc_card_count || 0}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedOrg(org)}
                  >
                    Gérer
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={Boolean(selectedOrg)}
        onClose={() => setSelectedOrg(null)}
        title={`Administration de l'Atelier : ${selectedOrg?.name}`}
        description={`Locataire ID: ${selectedOrg?.id}`}
      >
        {selectedOrg && (
          <div className="space-y-4">
            <Select
              label="Statut de l'Abonnement SaaS"
              defaultValue={selectedOrg.subscription_status || 'active'}
              id="sub_status_select"
            >
              <option value="active">Actif (Paiements à jour)</option>
              <option value="trialing">Période d&apos;Essai Pro</option>
              <option value="past_due">En Souffrance (Past Due)</option>
              <option value="canceled">Résilié / Suspendu</option>
            </Select>

            <Select
              label="Forfait Associé"
              defaultValue={selectedOrg.plan_id || 'starter'}
              id="plan_id_select"
            >
              <option value="starter">Starter (1 500 DZD / mois)</option>
              <option value="pro">Pro (4 500 DZD / mois)</option>
              <option value="enterprise">Enterprise (12 000 DZD / mois)</option>
            </Select>

            <div className="flex gap-2.5 pt-3">
              <Button
                className="flex-1"
                isLoading={actionLoadingId === selectedOrg.id}
                onClick={() => {
                  const statusEl = document.getElementById('sub_status_select') as HTMLSelectElement;
                  const planEl = document.getElementById('plan_id_select') as HTMLSelectElement;
                  handleUpdateOrg(selectedOrg.id, {
                    subscription_status: statusEl?.value,
                    plan_id: planEl?.value,
                  });
                }}
              >
                Appliquer les Modifications
              </Button>
              <Button variant="secondary" onClick={() => setSelectedOrg(null)} className="flex-1">
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
