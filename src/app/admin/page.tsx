'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  PageHeader,
  StatCard,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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

interface DashboardData {
  revenue: { paid: number; issued: number; total: number };
  activeVehicles: number;
  pipeline: {
    reception: number;
    inProgress: number;
    qualityCheck: number;
    readyToDeliver: number;
  };
  leaderboard: Array<{ id: string; full_name: string; role: string; job_count: number }>;
  lowStockCount: number;
  totalParts: number;
  totalClients: number;
  totalVehicles: number;
  cardsData: {
    total: number;
    active: number;
    available: number;
  };
  recentJobs: Array<{
    id: string;
    type: string;
    status: string;
    date_in: string;
    plate_number: string;
    make: string;
    model: string;
  }>;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const orgName = session?.user?.orgName || 'Atelier Principal';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalRev = data?.revenue?.total || 0;
  const paidRev = data?.revenue?.paid || 0;
  const activeVehicles = data?.activeVehicles || 0;
  const totalParts = data?.totalParts || 0;
  const lowStock = data?.lowStockCount || 0;

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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <PageHeader
        title="Cockpit de Télémétrie Atelier"
        subtitle={`Supervision opérationnelle et flux de travail en temps réel : ${orgName}`}
        breadcrumbs={[{ label: 'Cockpit' }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/vehicles">
              <Button variant="secondary" size="sm">
                Parc Véhicules
              </Button>
            </Link>
            <Link href="/admin/actions/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Nouvel Ordre de Réparation (OR)
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chiffre d'Affaires Mensuel"
          value={`${paidRev.toLocaleString()} DZD`}
          subtitle={`Sur ${totalRev.toLocaleString()} DZD facturés`}
          trend={{ value: '+14.2%', isPositive: true }}
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          label="Véhicules Actifs en Atelier"
          value={activeVehicles}
          subtitle="En cours d'intervention mécanique"
          icon={
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <StatCard
          label="Cartes PVC Déployées"
          value={data?.cardsData?.active || 0}
          subtitle={`${data?.cardsData?.available || 0} cartes prêtes en stock`}
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
        />

        <StatCard
          label="Pièces en Stock Magasin"
          value={totalParts}
          subtitle={lowStock > 0 ? `${lowStock} références sous le seuil critique` : 'Stock optimal'}
          badge={lowStock > 0 ? <Badge variant="danger">{lowStock} alertes</Badge> : <Badge variant="success">OK</Badge>}
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      {/* Repair Order Pipeline Stage Strip */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pipeline des Ordres de Réparation (Flux Atelier)</CardTitle>
            <CardDescription>Suivi des étapes d&apos;avancement des véhicules présents dans les baies</CardDescription>
          </div>
          <Link href="/admin/actions">
            <Button variant="ghost" size="sm">
              Voir tous les OR →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">1. Réception</span>
                <span className="font-mono font-bold text-accent">{data?.pipeline?.reception || 0}</span>
              </div>
              <div className="h-1.5 rounded-full bg-blue-500/20 overflow-hidden">
                <div className="h-full bg-accent rounded-full w-2/3" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">2. En Travaux</span>
                <span className="font-mono font-bold text-purple-400">{data?.pipeline?.inProgress || 0}</span>
              </div>
              <div className="h-1.5 rounded-full bg-purple-500/20 overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full w-4/5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">3. Contrôle Qualité</span>
                <span className="font-mono font-bold text-amber-400">{data?.pipeline?.qualityCheck || 0}</span>
              </div>
              <div className="h-1.5 rounded-full bg-amber-500/20 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-1/2" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">4. Prêt Livraison</span>
                <span className="font-mono font-bold text-emerald-400">{data?.pipeline?.readyToDeliver || 0}</span>
              </div>
              <div className="h-1.5 rounded-full bg-emerald-500/20 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Interventions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">Interventions Récentes & Ordres de Travail</h2>
            <p className="text-xs text-text-muted">Véhicules actuellement pris en charge par l&apos;équipe technique</p>
          </div>
          <Link href="/admin/actions/new">
            <Button variant="secondary" size="sm">
              + Ajouter un OR
            </Button>
          </Link>
        </div>

        <Table>
          <TableHeader>
            <tr>
              <TableHead>Véhicule & Immatriculation</TableHead>
              <TableHead>Type d&apos;Intervention</TableHead>
              <TableHead>Statut Actuel</TableHead>
              <TableHead>Date d&apos;Entrée</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingState colSpan={5} message="Chargement des interventions en cours..." />
            ) : !data?.recentJobs || data.recentJobs.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                title="Aucune intervention récente"
                description="Ouvrez un nouvel ordre de réparation pour suivre les travaux mécaniques."
                action={
                  <Link href="/admin/actions/new">
                    <Button variant="primary" size="sm">
                      Créer un Premier OR
                    </Button>
                  </Link>
                }
              />
            ) : (
              data.recentJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-surface-base border border-white/[0.08] text-accent text-xs">
                        {job.plate_number || 'EN ATTENTE'}
                      </span>
                      <span className="font-bold text-text-primary">
                        {job.make} {job.model}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-text-secondary capitalize font-medium">
                    {job.type}
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell className="font-mono text-xs text-text-muted">
                    {new Date(job.date_in).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/actions/${job.id}`}>
                      <Button variant="secondary" size="sm">
                        Ouvrir OR →
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
