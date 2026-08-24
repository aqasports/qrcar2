import React from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';

interface Worker {
  id: string;
  name: string;
  role: string;
}

interface LogActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error: string;
  formState: {
    logType: string;
    setLogType: (v: string) => void;
    logDescription: string;
    setLogDescription: (v: string) => void;
    logClientNotes: string;
    setLogClientNotes: (v: string) => void;
    logInternalNotes: string;
    setLogInternalNotes: (v: string) => void;
    logMileage: string;
    setLogMileage: (v: string) => void;
    logStatus: string;
    setLogStatus: (v: string) => void;
    logLaborCost: string;
    setLogLaborCost: (v: string) => void;
    selectedLeadWorkerId: string;
    setSelectedLeadWorkerId: (v: string) => void;
    workers: Worker[];
  };
}

export function LogActionModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  formState,
}: LogActionModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle Intervention Atelier"
      description="Enregistrez une opération de maintenance, révision ou réparation sur ce véhicule."
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Type d'Intervention"
            required
            value={formState.logType}
            onChange={(e) => formState.setLogType(e.target.value)}
          >
            <option value="oil_change">Vidange & Filtres</option>
            <option value="repair">Réparation Mécanique</option>
            <option value="maintenance">Entretien Périodique</option>
            <option value="inspection">Contrôle Technique / Diagnostic</option>
            <option value="tires">Pneumatiques & Géométrie</option>
            <option value="brakes">Freinage</option>
            <option value="bodywork">Carrosserie / Peinture</option>
            <option value="custom">Autre Intervention Spécifique</option>
          </Select>

          <Input
            label="Kilométrage Actuel (km)"
            type="number"
            required
            value={formState.logMileage}
            onChange={(e) => formState.setLogMileage(e.target.value)}
          />
        </div>

        <Textarea
          label="Description des Travaux"
          required
          rows={3}
          placeholder="Détail des réparations ou vérifications effectuées..."
          value={formState.logDescription}
          onChange={(e) => formState.setLogDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Technicien Responsable"
            value={formState.selectedLeadWorkerId}
            onChange={(e) => formState.setSelectedLeadWorkerId(e.target.value)}
          >
            <option value="">-- Sélectionner un intervenant --</option>
            {formState.workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.role})
              </option>
            ))}
          </Select>

          <Input
            label="Main d'œuvre Estimée (DZD)"
            type="number"
            step="0.01"
            value={formState.logLaborCost}
            onChange={(e) => formState.setLogLaborCost(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Textarea
            label="Notes Client (Visibles sur Passeport QR)"
            rows={2}
            placeholder="Conseils d'usage, pièces remplacées..."
            value={formState.logClientNotes}
            onChange={(e) => formState.setLogClientNotes(e.target.value)}
          />
          <Textarea
            label="Notes Internes Atelier"
            rows={2}
            placeholder="Observations techniques confidentielles..."
            value={formState.logInternalNotes}
            onChange={(e) => formState.setLogInternalNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2.5 pt-3">
          <Button type="submit" isLoading={isSubmitting} className="flex-1">
            Créer l&apos;Intervention
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
}
