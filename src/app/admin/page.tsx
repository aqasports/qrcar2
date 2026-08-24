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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <PageHeader
        title="Tableau de bord"
        subtitle={`Vue générale de l'activité atelier pour : ${orgName}`}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/actions/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Nouvel Ordre de Réparation
              </Button>
            </Link>
            <Link href="/admin/vehicles">
              <Button variant="secondary" size="sm">
                Flotte Véhicules
              </Button>
            </Link>
          </div>
        }
      />

      {/* Primary KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chiffre d'Affaires Encaissé"
          value={`${paidRev.toLocaleString()} DZD`}
          subtitle={`Sur un total facturé de ${totalRev.toLocaleString()} DZD`}
          trend={{ value: `${totalRev > 0 ? Math.round((paidRev / totalRev) * 100) : 100}% encaissé`, isPositive: true }}
          icon={
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          label="Véhicules en Atelier"
          value={activeVehicles}
          subtitle="Interventions en cours sur les ponts"
          icon={
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <StatCard
          label="Santé du Stock Pièces"
          value={`${totalParts} réf.`}
          subtitle={lowStock > 0 ? `${lowStock} alerte(s) de réapprovisionnement` : 'Niveaux de stock nominaux'}
          badge={lowStock > 0 ? <Badge variant="danger">{lowStock} alertes</Badge> : <Badge variant="success">Optimal</Badge>}
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <StatCard
          label="Passeports PVC Actifs"
          value={data?.cardsData?.active || 0}
          subtitle={`${data?.cardsData?.available || 0} cartes vierges prêtes à lier`}
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
      </div>

      {/* Workshop Workflow Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Flux des Véhicules en Atelier</CardTitle>
          <span className="text-xs text-text-muted">Évolution des ordres de réparation en direct</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-base border border-border-subtle text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-text-muted block">1. Réception / Devis</span>
              <span className="text-2xl font-black text-text-primary font-mono">{data?.pipeline?.reception || 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-base border border-accent/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-accent block">2. En Réparation</span>
              <span className="text-2xl font-black text-accent font-mono">{data?.pipeline?.inProgress || 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-base border border-border-subtle text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">3. Contrôle Qualité</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{data?.pipeline?.qualityCheck || 0}</span>
            </div>
            <div className="p-4 rounded-xl bg-surface-base border border-emerald-500/30 text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">4. Prêt pour Restitution</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{data?.pipeline?.readyToDeliver || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières Interventions Atelier</CardTitle>
          <Link href="/admin/actions" className="text-xs font-bold text-accent hover:text-accent-hover">
            Voir tous les ordres de réparation →
          </Link>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <Table className="rounded-none border-0 shadow-none">
            <TableHeader>
              <tr>
                <TableHead>Date</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingState colSpan={5} message="Chargement des interventions..." />
              ) : !data?.recentJobs || data.recentJobs.length === 0 ? (
                <TableEmptyState
                  colSpan={5}
                  title="Aucune intervention récente"
                  description="Aucun ordre de réparation n'a été enregistré récemment."
                  action={
                    <Link href="/admin/actions/new">
                      <Button variant="primary" size="sm">
                        Créer une Intervention
                      </Button>
                    </Link>
                  }
                />
              ) : (
                data.recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="text-text-muted font-medium whitespace-nowrap">
                      {new Date(job.date_in).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-bold text-text-primary">
                      {job.plate_number} — <span className="text-text-secondary font-normal">{job.make} {job.model}</span>
                    </TableCell>
                    <TableCell className="capitalize text-text-secondary">{job.type}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/actions/${job.id}`}
                        className="text-xs font-bold text-accent hover:text-accent-hover"
                      >
                        Détails
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
