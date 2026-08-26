import React from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface WorkerOption {
  id: string;
  full_name: string;
  role: string;
  active?: boolean;
}

interface AssignWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: WorkerOption[];
  onAssignWorker: (e: React.FormEvent) => void;
  isSaving: boolean;
  error: string;
  selectedWorkerId: string;
  setSelectedWorkerId: (id: string) => void;
  roleOnJob: 'lead' | 'assist';
  setRoleOnJob: (role: 'lead' | 'assist') => void;
  hours: string;
  setHours: (h: string) => void;
}

export function AssignWorkerModal({
  isOpen,
  onClose,
  workers,
  onAssignWorker,
  isSaving,
  error,
  selectedWorkerId,
  setSelectedWorkerId,
  roleOnJob,
  setRoleOnJob,
  hours,
  setHours,
}: AssignWorkerModalProps) {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.workers.addWorker}
      description={t.workers.subtitle}
    >
      <form onSubmit={onAssignWorker} className="space-y-4 font-sans">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
            {error}
          </div>
        )}

        <Select
          label={t.workers.fullName}
          required
          value={selectedWorkerId}
          onChange={(e) => setSelectedWorkerId(e.target.value)}
        >
          <option value="">-- {t.workers.role} --</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.full_name} ({w.role})
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t.workers.role}
            value={roleOnJob}
            onChange={(e) => setRoleOnJob(e.target.value as 'lead' | 'assist')}
          >
            <option value="lead">Responsable Principal</option>
            <option value="assist">Assistant / Soutien</option>
          </Select>

          <Input
            label={`${t.actions.laborCost} (h)`}
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5 pt-3">
          <Button type="submit" isLoading={isSaving} className="flex-1">
            {t.common.save}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {t.common.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
