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
  DataTable,
  ColumnDef,
  Badge,
  Button,
  Progress,
  CurrencyDisplay,
  SkeletonGrid,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

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

type RecentJob = DashboardData['recentJobs'][number];

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { t, locale } = useI18n();
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

  const totalPipelineCount =
    (data?.pipeline?.reception || 0) +
    (data?.pipeline?.inProgress || 0) +
    (data?.pipeline?.qualityCheck || 0) +
    (data?.pipeline?.readyToDeliver || 0) || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'invoiced':
        return <Badge variant="success">{t.actions.statusCompleted}</Badge>;
      case 'in_progress':
        return <Badge variant="info" pulse>{t.actions.statusInProgress}</Badge>;
      case 'open':
      case 'pending':
        return <Badge variant="warning">{t.actions.statusPending}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: ColumnDef<RecentJob>[] = [
    {
      key: 'plate_number',
      header: t.vehicles.plate,
      sortable: true,
      render: (job) => (
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-surface-base border border-border-default text-accent text-xs">
            {job.plate_number || 'EN ATTENTE'}
          </span>
          <span className="font-bold text-text-primary">
            {job.make} {job.model}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: t.actions.serviceType,
      sortable: true,
      render: (job) => (
        <span className="text-text-secondary capitalize font-medium">
          {job.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: t.common.status,
      sortable: true,
      render: (job) => getStatusBadge(job.status),
    },
    {
      key: 'date_in',
      header: t.actions.dateIn,
      sortable: true,
      render: (job) => (
        <span className="font-mono text-xs text-text-muted">
          {new Date(job.date_in).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-DZ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t.common.actions_label,
      align: 'right',
      render: (job) => (
        <Link href={`/admin/actions/${job.id}`}>
          <Button variant="secondary" size="xs">
            {t.common.viewDetails} →
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header */}
      <PageHeader
        title={t.dashboard.title}
        subtitle={`${t.dashboard.subtitle} • ${orgName}`}
        breadcrumbs={[{ label: t.common.dashboard }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/admin/vehicles">
              <Button variant="secondary" size="sm">
                {t.vehicles.title.split('&')[0]}
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
                {t.actions.newAction}
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 Executive KPI Cards */}
      {loading ? (
        <SkeletonGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t.dashboard.monthlyRevenue}
            value={<CurrencyDisplay amount={paidRev} size="xl" />}
            subtitle={`Sur ${totalRev.toLocaleString()} ${t.common.currency} facturés`}
            trend={{ value: '+14.2%', isPositive: true }}
            icon={
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            label={t.dashboard.vehiclesInShop}
            value={activeVehicles}
            subtitle={t.dashboard.vehiclesInShop}
            icon={
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          <StatCard
            label={t.dashboard.activePassports}
            value={data?.cardsData?.active || 0}
            subtitle={`${data?.cardsData?.available || 0} cartes prêtes en stock`}
            icon={
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />

          <StatCard
            label={t.inventory.title.split('&')[0]}
            value={totalParts}
            subtitle={lowStock > 0 ? `${lowStock} références sous le seuil critique` : 'Stock optimal'}
            badge={lowStock > 0 ? <Badge variant="danger">{lowStock} alertes</Badge> : <Badge variant="success">OK</Badge>}
            icon={
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
          />
        </div>
      )}

      {/* Repair Order Pipeline Stage Strip */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t.dashboard.recentJobs}</CardTitle>
            <CardDescription>{t.dashboard.recentJobsDesc}</CardDescription>
          </div>
          <Link href="/admin/actions">
            <Button variant="ghost" size="sm">
              {t.common.viewDetails} →
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">1. {t.actions.statusPending}</span>
                <span className="font-mono font-bold text-accent">{data?.pipeline?.reception || 0}</span>
              </div>
              <Progress
                value={data?.pipeline?.reception || 0}
                max={totalPipelineCount}
                variant="primary"
                size="sm"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">2. {t.actions.statusInProgress}</span>
                <span className="font-mono font-bold text-purple-400">{data?.pipeline?.inProgress || 0}</span>
              </div>
              <Progress
                value={data?.pipeline?.inProgress || 0}
                max={totalPipelineCount}
                variant="info"
                size="sm"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">3. Contrôle Qualité</span>
                <span className="font-mono font-bold text-amber-400">{data?.pipeline?.qualityCheck || 0}</span>
              </div>
              <Progress
                value={data?.pipeline?.qualityCheck || 0}
                max={totalPipelineCount}
                variant="warning"
                size="sm"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-semibold uppercase tracking-wider">4. {t.actions.statusCompleted}</span>
                <span className="font-mono font-bold text-emerald-400">{data?.pipeline?.readyToDeliver || 0}</span>
              </div>
              <Progress
                value={data?.pipeline?.readyToDeliver || 0}
                max={totalPipelineCount}
                variant="success"
                size="sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Interventions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">{t.dashboard.recentJobs}</h2>
            <p className="text-xs text-text-muted">{t.dashboard.recentJobsDesc}</p>
          </div>
          <Link href="/admin/actions/new">
            <Button variant="secondary" size="sm">
              + {t.actions.newAction}
            </Button>
          </Link>
        </div>

        <DataTable<RecentJob>
          columns={columns}
          data={data?.recentJobs || []}
          keyExtractor={(job) => String(job.id)}
          loading={loading}
          loadingMessage={t.common.loading}
          emptyTitle={t.common.empty}
          emptyDescription={t.common.noData}
          emptyAction={
            <Link href="/admin/actions/new">
              <Button variant="primary" size="sm">
                {t.actions.newAction}
              </Button>
            </Link>
          }
          searchPlaceholder={t.common.search}
        />
      </div>
    </div>
  );
}
