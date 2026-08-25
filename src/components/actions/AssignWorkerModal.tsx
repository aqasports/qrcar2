import React from 'react';
import { Modal, Button, Input, Select } from '@/components/ui';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assigner un Intervenant"
      description="Ajoutez un technicien responsable ou un assistant à l'équipe en charge des travaux."
    >
      <form onSubmit={onAssignWorker} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
            {error}
          </div>
        )}

        <Select
          label="Sélectionner l'Intervenant"
          required
          value={selectedWorkerId}
          onChange={(e) => setSelectedWorkerId(e.target.value)}
        >
          <option value="">-- Choisir un collaborateur --</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.full_name} ({w.role})
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Rôle sur l'Intervention"
            value={roleOnJob}
            onChange={(e) => setRoleOnJob(e.target.value as 'lead' | 'assist')}
          >
            <option value="lead">Responsable Principal</option>
            <option value="assist">Assistant / Soutien</option>
          </Select>

          <Input
            label="Temps Alloué (heures)"
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5 pt-3">
          <Button type="submit" isLoading={isSaving} className="flex-1">
            Confirmer l&apos;Assignation
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
}
