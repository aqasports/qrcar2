'use client';

import React, { useState, useEffect } from 'react';
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
  Select,
  Textarea,
  Modal,
} from '@/components/ui';

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
      case 'approved':
        return <Badge variant="success">Publiée & Active</Badge>;
      case 'submitted':
        return <Badge variant="warning" pulse>En Examen</Badge>;
      case 'rejected':
        return <Badge variant="danger">Refusée</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspendue</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Modération de l'App Store"
        subtitle="Examen de conformité des applications développeurs tiers, validation des scopes et publication"
        breadcrumbs={[
          { label: 'Platform Admin', href: '/platform-admin' },
          { label: 'Applications Tiers' },
        ]}
        badge={<Badge variant="danger">Super Admin</Badge>}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="w-52">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts ({apps.length})</option>
            <option value="submitted">En attente d&apos;examen</option>
            <option value="published">Publiées</option>
            <option value="rejected">Refusées</option>
            <option value="suspended">Suspendues</option>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Application</TableHead>
            <TableHead>Développeur</TableHead>
            <TableHead>Scopes Demandés</TableHead>
            <TableHead className="text-right">Installations</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement des applications..." />
          ) : apps.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucune application dans ce filtre"
              description="Toutes les soumissions de connecteurs partenaires apparaîtront ici pour validation."
            />
          ) : (
            apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <span className="font-bold text-text-primary block">{app.name}</span>
                  <span className="text-xs font-mono text-text-muted block">/{app.slug}</span>
                </TableCell>
                <TableCell>
                  <span className="text-text-primary block">{app.developer?.name}</span>
                  <span className="text-xs text-text-muted block">{app.developer?.email}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {app.requestedScopes?.map((sc) => (
                      <Badge key={sc} variant="neutral" size="sm">
                        {sc}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-text-primary">
                  {app.activeInstallsCount}
                </TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {app.status === 'submitted' && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={actionLoading}
                          onClick={() => handleReview(app.id, 'approve')}
                        >
                          Approuver
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setRejectionReason('');
                            setRejectionModalOpen(true);
                          }}
                        >
                          Refuser
                        </Button>
                      </>
                    )}
                    {app.status === 'published' && (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actionLoading}
                        onClick={() => handleReview(app.id, 'suspend')}
                      >
                        Suspendre
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        title="Refus de l'Application"
        description={`Indiquez la raison du refus technique pour ${selectedApp?.name}`}
      >
        <div className="space-y-4">
          <Textarea
            label="Motif du Refus Technique"
            required
            rows={3}
            placeholder="Scopes trop larges, documentation manquante, non conformité RGPD/protection des données..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3">
            <Button
              variant="danger"
              className="flex-1"
              isLoading={actionLoading}
              onClick={() => selectedApp && handleReview(selectedApp.id, 'reject', rejectionReason)}
            >
              Confirmer le Refus
            </Button>
            <Button variant="secondary" onClick={() => setRejectionModalOpen(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
