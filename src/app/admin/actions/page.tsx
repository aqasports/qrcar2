'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
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
} from '@/components/ui';
import { INTERVENTION_TEMPLATES } from '@/lib/intervention-templates';

interface Action {
  id: string;
  vehicle_id: string;
  plate_number: string;
  make: string;
  model: string;
  client_name: string;
  type: 'repair' | 'maintenance' | 'inspection' | 'other';
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'invoiced';
  date_in: string;
  date_out: string | null;
  mileage_at_service: number;
}

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadActions() {
      try {
        let url = '/api/actions';
        if (statusFilter) {
          url += `?status=${statusFilter}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          let filtered = data;
          if (statusFilter) {
            filtered = data.filter((a) => a.status === statusFilter);
          }
          setActions(filtered);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadActions();
    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'invoiced':
        return <Badge variant="success">Terminé</Badge>;
      case 'in_progress':
        return <Badge variant="info" pulse>En Atelier</Badge>;
      case 'open':
        return <Badge variant="warning">Ouvert</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Interventions & Travaux Atelier"
        subtitle="Journal des ordres de réparation, entretiens et modèles spécialisés"
        breadcrumbs={[{ label: 'Cockpit', href: '/admin' }, { label: 'Ordres de Réparation' }]}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-surface-raised p-1 rounded-xl border border-border-subtle">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === ''
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'open'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Ouvert
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'in_progress'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                En cours
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === 'completed'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Terminé
              </button>
            </div>

            <Link href="/admin/actions/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                }
              >
                Nouvel OR
              </Button>
            </Link>
          </div>
        }
      />

      {/* Specialty Trade Studio Quick Launchers */}
      <Card className="p-4 space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
          Accès Rapide par Métier / Poste Atelier
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {INTERVENTION_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/admin/actions/new?template=${tpl.id}`}
              className="p-2.5 rounded-xl bg-surface-base border border-border-subtle hover:border-accent/40 text-left transition group"
            >
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block group-hover:text-accent">
                {tpl.specialty}
              </span>
              <span className="text-xs font-bold text-text-primary group-hover:text-white block mt-0.5 leading-tight truncate">
                {tpl.name}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Service Action Listing */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Date Entrée</TableHead>
            <TableHead>Véhicule</TableHead>
            <TableHead>Immatriculation</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Kilométrage</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={8} message="Chargement du journal d'interventions..." />
          ) : actions.length === 0 ? (
            <TableEmptyState
              colSpan={8}
              title="Aucune intervention enregistrée"
              description="Ouvrez le Studio pour enregistrer une intervention ou utiliser un modèle spécialisé."
              action={
                <Link href="/admin/actions/new">
                  <Button variant="primary" size="sm">
                    Ouvrir le Studio d&apos;Intervention
                  </Button>
                </Link>
              }
            />
          ) : (
            actions.map((act) => (
              <TableRow key={act.id}>
                <TableCell className="text-text-muted font-mono text-xs">
                  {new Date(act.date_in).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="font-bold text-text-primary">
                  <Link href={`/admin/vehicles/${act.vehicle_id}`} className="hover:text-accent transition">
                    {act.make} {act.model}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-surface-base border border-border-subtle text-accent text-xs">
                    {act.plate_number}
                  </span>
                </TableCell>
                <TableCell className="capitalize text-text-secondary font-medium">{act.type}</TableCell>
                <TableCell className="text-text-muted truncate max-w-xs">{act.description}</TableCell>
                <TableCell className="text-text-muted font-mono">{act.mileage_at_service.toLocaleString()} km</TableCell>
                <TableCell>{getStatusBadge(act.status)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/actions/${act.id}`}>
                    <Button variant="secondary" size="sm">
                      Ouvrir Dossier →
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
