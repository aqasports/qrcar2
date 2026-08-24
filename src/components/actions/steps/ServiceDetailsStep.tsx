import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Textarea } from '@/components/ui';
import { INTERVENTION_TEMPLATES } from '@/lib/intervention-templates';

interface Worker {
  id: string;
  full_name: string;
  role: string;
}

interface ServiceDetailsStepProps {
  activeSpecialtyId: string;
  onSelectSpecialty: (id: string) => void;
  serviceType: string;
  setServiceType: (v: any) => void;
  description: string;
  setDescription: (v: string) => void;
  mileageAtService: string;
  setMileageAtService: (v: string) => void;
  status: string;
  setStatus: (v: any) => void;
  laborCost: string;
  setLaborCost: (v: string) => void;
  leadWorkerId: string;
  setLeadWorkerId: (v: string) => void;
  workerHours: string;
  setWorkerHours: (v: string) => void;
  clientVisibleNotes: string;
  setClientVisibleNotes: (v: string) => void;
  internalNotes: string;
  setInternalNotes: (v: string) => void;
  workers: Worker[];
}

export function ServiceDetailsStep({
  activeSpecialtyId,
  onSelectSpecialty,
  serviceType,
  setServiceType,
  description,
  setDescription,
  mileageAtService,
  setMileageAtService,
  status,
  setStatus,
  laborCost,
  setLaborCost,
  leadWorkerId,
  setLeadWorkerId,
  workerHours,
  setWorkerHours,
  clientVisibleNotes,
  setClientVisibleNotes,
  internalNotes,
  setInternalNotes,
  workers,
}: ServiceDetailsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Paramètres & Métier d&apos;Atelier</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Specialty Selector Chips */}
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            Spécialité & Gabarit d&apos;Intervention
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {INTERVENTION_TEMPLATES.map((tmpl) => {
              const isSelected = activeSpecialtyId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => onSelectSpecialty(tmpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-white shadow-lg shadow-blue-500/10'
                      : 'bg-surface-base border-border-subtle hover:border-border-default text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="text-xs font-bold block">{tmpl.name}</span>
                  <span className="text-[10px] text-text-muted block mt-0.5 capitalize">{tmpl.specialty}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Type d'Opération"
            required
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="maintenance">Entretien & Vidange</option>
            <option value="repair">Réparation Mécanique</option>
            <option value="inspection">Contrôle / Diagnostic</option>
            <option value="other">Autre Opération</option>
          </Select>

          <Input
            label="Kilométrage Compteur (km)"
            type="number"
            required
            value={mileageAtService}
            onChange={(e) => setMileageAtService(e.target.value)}
          />

          <Select
            label="Statut Initial"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="in_progress">En Cours en Atelier</option>
            <option value="open">Ouverte / Planifiée</option>
            <option value="completed">Travaux Terminés</option>
          </Select>
        </div>

        <Textarea
          label="Désignation des Travaux"
          required
          rows={3}
          placeholder="Détail des réparations..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Technicien Responsable"
            value={leadWorkerId}
            onChange={(e) => setLeadWorkerId(e.target.value)}
          >
            <option value="">-- Aucun technicien assigné --</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} ({w.role})
              </option>
            ))}
          </Select>

          <Input
            label="Temps Alloué (heures)"
            type="number"
            step="0.5"
            value={workerHours}
            onChange={(e) => setWorkerHours(e.target.value)}
          />

          <Input
            label="Main d'œuvre Forfaitaire (DZD)"
            type="number"
            step="0.01"
            value={laborCost}
            onChange={(e) => setLaborCost(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Textarea
            label="Notes Client (Visibles sur le Passeport QR)"
            rows={2}
            placeholder="Conseils d'usage..."
            value={clientVisibleNotes}
            onChange={(e) => setClientVisibleNotes(e.target.value)}
          />
          <Textarea
            label="Notes Internes Atelier"
            rows={2}
            placeholder="Détails techniques..."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
