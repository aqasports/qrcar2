'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  DataTable,
  ColumnDef,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  CurrencyDisplay,
} from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface Worker {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  hourly_rate: number;
  active: boolean;
  user_id: string | null;
}

interface UserAccount {
  id: string;
  username: string;
  role: string;
}

export default function WorkersPage() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const userRole = session?.user?.role;
  const { toast } = useToast();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleInput, setRoleInput] = useState('Technicien');
  const [hourlyRate, setHourlyRate] = useState('1500.00');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workers');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setWorkers(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setUsers(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  useEffect(() => {
    if (userRole && userRole !== 'technician') {
      fetchWorkers();
      fetchUsers();
    }
  }, [userRole, fetchWorkers, fetchUsers]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFullName('');
    setPhone('');
    setRoleInput('Technicien');
    setHourlyRate('1500.00');
    setLinkedUserId('');
    setActive(true);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setIsEditing(true);
    setSelectedWorkerId(w.id);
    setFullName(w.full_name);
    setPhone(w.phone || '');
    setRoleInput(w.role);
    setHourlyRate(w.hourly_rate.toString());
    setLinkedUserId(w.user_id || '');
    setActive(w.active);
    setFormError('');
    setShowModal(true);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!fullName.trim() || !roleInput.trim()) {
      setFormError('Le nom et la spécialité sont obligatoires.');
      setSubmitting(false);
      return;
    }

    const payload = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      role: roleInput.trim(),
      hourly_rate: parseFloat(hourlyRate) || 0,
      user_id: linkedUserId || null,
      active,
    };

    try {
      const url = isEditing ? `/api/workers/${selectedWorkerId}` : '/api/workers';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      }

      toast.success(isEditing ? 'Fiche collaborateur mise à jour.' : 'Nouveau collaborateur enregistré.');
      setShowModal(false);
      fetchWorkers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de communication.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole === 'technician') {
    return (
      <div className="p-8 text-center bg-surface-raised border border-rose-500/20 rounded-2xl max-w-xl mx-auto space-y-2">
        <h3 className="font-bold text-text-primary">Accès Restreint</h3>
        <p className="text-xs text-text-muted leading-relaxed">
          La gestion des techniciens et des taux horaires est réservée aux responsables d&apos;atelier.
        </p>
      </div>
    );
  }

  const columns: ColumnDef<Worker>[] = [
    {
      key: 'full_name',
      header: t.workers.fullName,
      sortable: true,
      render: (w) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-surface-base border border-border-default flex items-center justify-center font-bold text-xs text-accent font-mono shadow-xs">
            {w.full_name.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-text-primary block">{w.full_name}</span>
            <span className="text-[11px] text-text-muted">{w.role}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t.workers.phone,
      sortable: true,
      render: (w) => (
        <span className="font-mono text-xs text-text-secondary">
          {w.phone || '—'}
        </span>
      ),
    },
    {
      key: 'hourly_rate',
      header: t.actions.laborCost,
      sortable: true,
      align: 'right',
      render: (w) => (
        <div className="text-right">
          <CurrencyDisplay amount={w.hourly_rate} size="sm" className="text-accent font-bold" />
          <span className="text-[10px] text-text-muted font-sans block">/ h</span>
        </div>
      ),
    },
    {
      key: 'active',
      header: t.common.status,
      sortable: true,
      render: (w) => (
        <Badge variant={w.active ? 'success' : 'neutral'}>
          {w.active ? t.workers.statusActive : t.workers.statusInactive}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t.common.actions_label,
      align: 'right',
      render: (w) => (
        <Button variant="ghost" size="xs" onClick={() => handleOpenEdit(w)}>
          {t.common.edit}
        </Button>
      ),
    },
  ];

  const userOptions = [
    { value: '', label: '-- Aucun compte utilisateur lié --' },
    ...users.map((u) => ({
      value: u.id,
      label: `${u.username} (${u.role})`,
    })),
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.workers.title}
        subtitle={t.workers.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.workers.title.split('&')[0] },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t.workers.addWorker}
          </Button>
        }
      />

      <DataTable<Worker>
        columns={columns}
        data={workers}
        keyExtractor={(w) => String(w.id)}
        loading={loading}
        loadingMessage={t.common.loading}
        emptyTitle={t.common.empty}
        emptyDescription={t.common.noData}
        emptyAction={
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            {t.workers.addWorker}
          </Button>
        }
        searchPlaceholder={t.workers.searchPlaceholder}
        pageSize={15}
      />

      {/* Worker Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? t.common.edit : t.workers.addWorker}
        description={t.workers.subtitle}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} disabled={submitting}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveWorker} isLoading={submitting}>
              {t.common.save}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveWorker} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label={t.workers.fullName}
            required
            placeholder="ex. Youcef Mansouri"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t.workers.phone}
              type="tel"
              placeholder="ex. 0661 23 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label={t.workers.role}
              required
              placeholder="ex. Électricien Auto, Mécanicien"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t.actions.laborCost} (${t.common.currency}/h)`}
              type="number"
              step="0.01"
              required
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />

            <Select
              label="Compte Utilisateur Lié"
              value={linkedUserId}
              onChange={(e) => setLinkedUserId(e.target.value)}
              options={userOptions}
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-border-default bg-surface-base text-accent focus:ring-accent/20 cursor-pointer"
              />
              <span>Collaborateur actuellement en activité dans l&apos;atelier</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
