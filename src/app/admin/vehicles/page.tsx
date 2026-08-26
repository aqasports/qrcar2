'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PageHeader,
  DataTable,
  ColumnDef,
  Badge,
  Button,
} from '@/components/ui';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  current_mileage: number;
  client_name: string;
  client_id: string | null;
  fuel_type?: string;
}

interface Client {
  id: string;
  full_name: string;
  phone: string;
}

export default function VehiclesPage() {
  const { t } = useI18n();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setVehicles(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setClients(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchClients();
  }, []);

  const columns: ColumnDef<Vehicle>[] = [
    {
      key: 'plate_number',
      header: t.vehicles.plate,
      sortable: true,
      render: (v) => (
        <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-surface-base border border-border-default text-accent text-xs">
          {v.plate_number}
        </span>
      ),
    },
    {
      key: 'make',
      header: t.vehicles.make,
      sortable: true,
      render: (v) => (
        <div>
          <span className="font-bold text-text-primary">
            {v.make} {v.model}
          </span>
          <span className="text-xs text-text-muted ml-2 font-mono">({v.year})</span>
        </div>
      ),
    },
    {
      key: 'current_mileage',
      header: t.vehicles.mileage,
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-text-primary">
          {(v.current_mileage || 0).toLocaleString()} km
        </span>
      ),
    },
    {
      key: 'client_name',
      header: t.vehicles.client,
      sortable: true,
      render: (v) =>
        v.client_id ? (
          <Link
            href={`/admin/clients/${v.client_id}`}
            className="text-text-primary font-semibold hover:text-accent transition-colors"
          >
            {v.client_name}
          </Link>
        ) : (
          <Badge variant="warning">{t.vehicles.unlinkedPassport}</Badge>
        ),
    },
    {
      key: 'actions',
      header: t.common.actions_label,
      align: 'right',
      render: (v) => (
        <Link href={`/admin/vehicles/${v.id}`}>
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
        title={t.vehicles.title}
        subtitle={t.vehicles.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.vehicles.title.split('&')[0] },
        ]}
        actions={
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
            {t.vehicles.addVehicle}
          </Button>
        }
      />

      <DataTable<Vehicle>
        columns={columns}
        data={vehicles}
        keyExtractor={(v) => String(v.id)}
        loading={loading}
        loadingMessage={t.common.loading}
        emptyTitle={t.common.empty}
        emptyDescription={t.common.noData}
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
            {t.vehicles.addVehicle}
          </Button>
        }
        searchPlaceholder={t.vehicles.searchPlaceholder}
        pageSize={15}
      />

      <AddVehicleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        clients={clients}
        onVehicleCreated={fetchVehicles}
      />
    </div>
  );
}
