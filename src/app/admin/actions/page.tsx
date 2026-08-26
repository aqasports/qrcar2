'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  DataTable,
  ColumnDef,
  Badge,
  Button,
  Tabs,
  CurrencyDisplay,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

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
  labor_cost?: number;
  items_total?: number;
  template_name?: string;
}

interface RepairOrderTemplate {
  id: string;
  name: string;
  category: string;
  items_count?: number;
  total_items_cost?: number;
  default_labor_cost?: number;
}

export default function ActionsPage() {
  const { t, locale } = useI18n();
  const [actions, setActions] = useState<Action[]>([]);
  const [templates, setTemplates] = useState<RepairOrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [aRes, tRes] = await Promise.all([
          fetch('/api/actions'),
          fetch('/api/repair-templates'),
        ]);

        const [aJson, tJson] = await Promise.all([
          aRes.json(),
          tRes.json(),
        ]);

        const rawList = aJson?.data !== undefined ? aJson.data : aJson;
        const rawTemplates = tJson?.data !== undefined ? tJson.data : tJson;

        if (isMounted) {
          if (Array.isArray(rawList)) setActions(rawList);
          if (Array.isArray(rawTemplates)) setTemplates(rawTemplates);
        }
      } catch (err) {
        console.error('Failed to load actions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredActions = statusFilter === 'all'
    ? actions
    : actions.filter((a) => a.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'invoiced':
        return <Badge variant="success">{t.actions.statusCompleted}</Badge>;
      case 'in_progress':
        return <Badge variant="info" pulse>{t.actions.statusInProgress}</Badge>;
      case 'open':
        return <Badge variant="warning">{t.actions.statusPending}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Action>[] = [
    {
      key: 'date_in',
      header: t.actions.dateIn,
      sortable: true,
      render: (act) => (
        <span className="text-text-muted font-mono text-xs">
          {new Date(act.date_in).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-DZ')}
        </span>
      ),
    },
    {
      key: 'vehicle',
      header: t.actions.vehicle,
      sortable: true,
      render: (act) => (
        <div>
          <Link
            href={`/admin/vehicles/${act.vehicle_id}`}
            className="font-bold text-text-primary hover:text-accent transition-colors"
          >
            {act.make} {act.model}
          </Link>
          <span className="font-mono font-bold px-2 py-0.5 ml-2 rounded bg-surface-base border border-border-default text-accent text-[11px]">
            {act.plate_number}
          </span>
        </div>
      ),
    },
    {
      key: 'type',
      header: t.common.type,
      sortable: true,
      render: (act) => (
        <div className="space-y-0.5">
          <span className="capitalize text-text-secondary font-semibold text-xs block">
            {act.type}
          </span>
          {act.template_name && (
            <span className="text-[10px] text-accent block font-medium">
              {act.template_name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      header: t.common.description,
      render: (act) => (
        <span className="text-text-muted text-xs truncate max-w-xs block">
          {act.description}
        </span>
      ),
    },
    {
      key: 'mileage_at_service',
      header: t.actions.mileageAtService,
      sortable: true,
      render: (act) => (
        <span className="text-text-primary font-mono text-xs font-semibold">
          {(act.mileage_at_service || 0).toLocaleString()} km
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Montant Estimé',
      sortable: true,
      render: (act) => {
        const total = (act.items_total || 0) + (act.labor_cost || 0);
        return (
          <span className="font-mono font-bold text-accent text-xs">
            <CurrencyDisplay amount={total} currency="DZD" />
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t.common.status,
      sortable: true,
      render: (act) => getStatusBadge(act.status),
    },
    {
      key: 'actions',
      header: t.common.actions_label,
      align: 'right',
      render: (act) => (
        <Link href={`/admin/actions/${act.id}`}>
          <Button variant="secondary" size="xs">
            {t.common.viewDetails} →
          </Button>
        </Link>
      ),
    },
  ];

  const filterTabs = [
    { key: 'all', label: t.common.all, count: actions.length },
    { key: 'open', label: t.actions.statusPending, count: actions.filter((a) => a.status === 'open').length },
    { key: 'in_progress', label: t.actions.statusInProgress, count: actions.filter((a) => a.status === 'in_progress').length },
    { key: 'completed', label: t.actions.statusCompleted, count: actions.filter((a) => a.status === 'completed' || a.status === 'invoiced').length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.actions.title}
        subtitle={t.actions.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.actions.title.split('&')[0] },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/repair-templates">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
              >
                Modèles d'OR
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

      {/* Specialty Trade Studio Dynamic Quick Launchers */}
      {templates.length > 0 && (
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
              Accès Rapide par Forfait / Poste Atelier
            </span>
            <Link href="/admin/repair-templates" className="text-[11px] font-semibold text-accent hover:underline">
              Gérer les {templates.length} modèles →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {templates.slice(0, 5).map((tpl) => (
              <Link
                key={tpl.id}
                href={`/admin/actions/new?template=${tpl.id}`}
                className="p-2.5 rounded-xl bg-surface-base border border-border-subtle hover:border-accent/40 text-left transition group"
              >
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider block group-hover:text-accent capitalize">
                  {tpl.category}
                </span>
                <span className="text-xs font-bold text-text-primary group-hover:text-white block mt-0.5 leading-tight truncate">
                  {tpl.name}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Status Filter Tabs */}
      <Tabs
        tabs={filterTabs}
        activeKey={statusFilter}
        onChange={setStatusFilter}
        variant="pills"
      />

      {/* Service Actions DataTable */}
      <DataTable<Action>
        columns={columns}
        data={filteredActions}
        keyExtractor={(act) => String(act.id)}
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
        searchPlaceholder={t.actions.searchPlaceholder}
        pageSize={15}
      />
    </div>
  );
}
