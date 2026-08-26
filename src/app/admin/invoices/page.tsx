'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  DataTable,
  ColumnDef,
  Badge,
  Button,
  Tabs,
  CurrencyDisplay,
  ConfirmDialog,
} from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface Invoice {
  id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  plate_number: string;
  client_name: string;
  action_type: string;
  created_at: string;
}

export default function InvoicesPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const role = session?.user?.role;
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState('');

  // Confirm dialog state for marking as paid
  const [confirmInvoiceId, setConfirmInvoiceId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setInvoices(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role && role !== 'technician') {
      fetchInvoices();
    }
  }, [role, fetchInvoices]);

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    setUpdatingId(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossible de mettre à jour le statut de la facture.');
      }

      toast.success(newStatus === 'paid' ? 'Facture marquée comme réglée.' : 'Statut mis à jour.');
      setConfirmInvoiceId(null);
      fetchInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de communication.';
      toast.error(msg);
    } finally {
      setUpdatingId('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">{t.invoices.statusPaid}</Badge>;
      case 'issued':
        return <Badge variant="warning">{t.invoices.statusIssued}</Badge>;
      case 'draft':
        return <Badge variant="neutral">{t.invoices.statusDraft}</Badge>;
      case 'cancelled':
        return <Badge variant="danger">{t.actions.statusCancelled}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (role === 'technician') {
    return (
      <div className="p-8 text-center bg-surface-raised border border-rose-500/20 rounded-2xl max-w-xl mx-auto space-y-2">
        <h3 className="font-bold text-text-primary">Accès Restreint</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          La gestion de la facturation et des règlements est réservée aux chefs d&apos;atelier et administrateurs.
        </p>
      </div>
    );
  }

  const filteredInvoices = statusFilter === 'all'
    ? invoices
    : invoices.filter((i) => i.status === statusFilter);

  const columns: ColumnDef<Invoice>[] = [
    {
      key: 'invoice_number',
      header: t.invoices.invoiceNumber,
      sortable: true,
      render: (inv) => (
        <span className="font-mono font-bold text-accent text-xs">
          {inv.invoice_number}
        </span>
      ),
    },
    {
      key: 'client_name',
      header: t.invoices.client,
      sortable: true,
      render: (inv) => (
        <div>
          <span className="font-bold text-text-primary block">{inv.client_name}</span>
          <span className="font-mono text-[11px] text-text-muted">{inv.plate_number}</span>
        </div>
      ),
    },
    {
      key: 'action_type',
      header: t.actions.serviceType,
      sortable: true,
      render: (inv) => (
        <span className="capitalize text-text-secondary text-xs font-medium">
          {inv.action_type}
        </span>
      ),
    },
    {
      key: 'subtotal',
      header: t.invoices.totalHT,
      sortable: true,
      align: 'right',
      render: (inv) => <CurrencyDisplay amount={inv.subtotal} size="sm" />,
    },
    {
      key: 'tax_amount',
      header: `${t.invoices.vatAmount} (19%)`,
      sortable: true,
      align: 'right',
      render: (inv) => <CurrencyDisplay amount={inv.tax_amount} size="sm" className="text-text-muted" />,
    },
    {
      key: 'total',
      header: t.invoices.totalTTC,
      sortable: true,
      align: 'right',
      render: (inv) => <CurrencyDisplay amount={inv.total} size="sm" className="text-accent font-bold" />,
    },
    {
      key: 'status',
      header: t.common.status,
      sortable: true,
      render: (inv) => getStatusBadge(inv.status),
    },
    {
      key: 'actions',
      header: t.common.actions_label,
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-2">
          {inv.status !== 'paid' && (
            <Button
              variant="secondary"
              size="xs"
              isLoading={updatingId === inv.id}
              onClick={() => setConfirmInvoiceId(inv.id)}
            >
              {t.invoices.payInvoice}
            </Button>
          )}
          <a
            href={`/api/invoices/${inv.id}/download`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg text-accent hover:text-accent-hover hover:bg-surface-overlay transition-colors"
            title={t.invoices.downloadPDF}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </a>
        </div>
      ),
    },
  ];

  const filterTabs = [
    { key: 'all', label: t.common.all, count: invoices.length },
    { key: 'issued', label: t.invoices.statusIssued, count: invoices.filter((i) => i.status === 'issued').length },
    { key: 'paid', label: t.invoices.statusPaid, count: invoices.filter((i) => i.status === 'paid').length },
    { key: 'draft', label: t.invoices.statusDraft, count: invoices.filter((i) => i.status === 'draft').length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.invoices.title}
        subtitle={t.invoices.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.invoices.title.split('&')[0] },
        ]}
      />

      <Tabs
        tabs={filterTabs}
        activeKey={statusFilter}
        onChange={setStatusFilter}
        variant="pills"
      />

      <DataTable<Invoice>
        columns={columns}
        data={filteredInvoices}
        keyExtractor={(inv) => String(inv.id)}
        loading={loading}
        loadingMessage={t.common.loading}
        emptyTitle={t.common.empty}
        emptyDescription={t.common.noData}
        emptyAction={
          <Link href="/admin/actions">
            <Button variant="primary" size="sm">
              {t.common.actions}
            </Button>
          </Link>
        }
        searchPlaceholder={t.invoices.searchPlaceholder}
        pageSize={15}
      />

      <ConfirmDialog
        isOpen={!!confirmInvoiceId}
        onClose={() => setConfirmInvoiceId(null)}
        onConfirm={() => {
          if (confirmInvoiceId) {
            handleUpdateStatus(confirmInvoiceId, 'paid');
          }
        }}
        title={t.invoices.payInvoice}
        description="Voulez-vous marquer cette facture comme totalement réglée ? Cette action mettra à jour le statut comptable."
        confirmLabel={t.common.confirm}
        variant="primary"
        isLoading={!!updatingId}
      />
    </div>
  );
}
