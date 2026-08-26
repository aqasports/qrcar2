'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  DataTable,
  ColumnDef,
  Button,
} from '@/components/ui';
import { AddClientModal } from '@/components/clients/AddClientModal';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const role = session?.user?.role;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setClients(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const columns: ColumnDef<Client>[] = [
    {
      key: 'full_name',
      header: t.clients.fullName,
      sortable: true,
      render: (client) => (
        <span className="font-bold text-text-primary">
          {client.full_name}
        </span>
      ),
    },
    {
      key: 'phone',
      header: t.clients.phone,
      sortable: true,
      render: (client) => (
        <span className="font-mono text-xs font-semibold text-accent">
          {client.phone}
        </span>
      ),
    },
    {
      key: 'email',
      header: t.clients.email,
      sortable: true,
      render: (client) => (
        <span className="text-text-secondary text-xs">
          {client.email || '—'}
        </span>
      ),
    },
    {
      key: 'address',
      header: t.clients.address,
      sortable: true,
      render: (client) => (
        <span className="text-text-muted text-xs truncate max-w-[200px] block">
          {client.address || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t.common.actions_label,
      align: 'right',
      render: (client) => (
        <Link href={`/admin/clients/${client.id}`}>
          <Button variant="secondary" size="xs">
            {t.common.viewDetails} →
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.clients.title}
        subtitle={t.clients.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.common.clients },
        ]}
        actions={
          role !== 'technician' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t.clients.addClient}
            </Button>
          )
        }
      />

      <DataTable<Client>
        columns={columns}
        data={clients}
        keyExtractor={(c) => String(c.id)}
        loading={loading}
        loadingMessage={t.common.loading}
        emptyTitle={t.common.empty}
        emptyDescription={t.clients.noClients}
        emptyAction={
          role !== 'technician' ? (
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              {t.clients.addClient}
            </Button>
          ) : null
        }
        searchPlaceholder={t.clients.searchPlaceholder}
        pageSize={15}
      />

      <AddClientModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onClientCreated={fetchClients}
      />
    </div>
  );
}
