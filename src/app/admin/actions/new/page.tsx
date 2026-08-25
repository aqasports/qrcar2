'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader, Button, Spinner } from '@/components/ui';
import { VehicleSelectStep, Vehicle } from '@/components/actions/steps/VehicleSelectStep';
import {
  ServiceDetailsStep,
  TelemetryData,
  CheckpointStatus,
  Worker,
} from '@/components/actions/steps/ServiceDetailsStep';
import {
  PartsSelectionStep,
  CatalogPart,
  SelectedPart,
} from '@/components/actions/steps/PartsSelectionStep';
import { INTERVENTION_TEMPLATES } from '@/lib/intervention-templates';

export default function NewServiceActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicle_id') || '';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [catalogParts, setCatalogParts] = useState<CatalogPart[]>([]);
  const [loading, setLoading] = useState(true);

  // Workflow states
  const [selectedVehicleId, setSelectedVehicleId] = useState(preselectedVehicleId);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [activeSpecialtyId, setActiveSpecialtyId] = useState('oil_service');

  // Core parameters
  const [serviceType, setServiceType] = useState('maintenance');
  const [mileageAtService, setMileageAtService] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('in_progress');
  const [laborCost, setLaborCost] = useState('3000');
  const [clientVisibleNotes, setClientVisibleNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [leadWorkerId, setLeadWorkerId] = useState('');
  const [workerHours, setWorkerHours] = useState('1.5');

  // Specialty Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    oilGrade: '5W-30 C3 / RN0720',
    oilCapacityLiters: '4.5',
    serviceResetDone: true,
    railPressureBars: '1600',
    injector1Correction: '+0.1',
    injector2Correction: '-0.2',
    injector3Correction: '+0.1',
    injector4Correction: '-0.1',
    frontPadsMm: '10',
    rearPadsMm: '8',
    frontDiscsMm: '24.2',
    rearDiscsMm: '11.8',
    brakeFluidBoilingTemp: '240°C',
    sootLoadGrams: '4.2',
    diffPressureMbar: '12',
    adbluePouredLiters: '10',
  });

  // Quality Checkpoint Status State
  const [checkpointStatus, setCheckpointStatus] = useState<Record<string, CheckpointStatus>>({});

  // Selected Parts
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vRes, wRes, pRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/workers'),
          fetch('/api/parts'),
        ]);

        const [vData, wData, pData] = await Promise.all([
          vRes.json(),
          wRes.json(),
          pRes.json(),
        ]);

        if (Array.isArray(vData)) {
          setVehicles(vData);
          if (preselectedVehicleId) {
            const found = vData.find((v) => v.id === preselectedVehicleId);
            if (found) {
              setMileageAtService(found.current_mileage?.toString() || '');
              if (found.oil_type) {
                setTelemetry((prev) => ({ ...prev, oilGrade: found.oil_type || prev.oilGrade }));
              }
            }
          }
        }
        if (Array.isArray(wData)) setWorkers(wData.filter((w: Worker & { active?: boolean }) => w.active !== false));
        if (Array.isArray(pData)) setCatalogParts(pData);

        // Initialize default checkpoints for oil_service template
        const defaultTmpl = INTERVENTION_TEMPLATES.find((t) => t.id === 'oil_service');
        if (defaultTmpl && defaultTmpl.checkpoints) {
          const initCp: Record<string, CheckpointStatus> = {};
          defaultTmpl.checkpoints.forEach((c) => {
            initCp[c.id] = 'ok';
          });
          setCheckpointStatus(initCp);
        }
      } catch (err) {
        console.error('Failed to load form prerequisites:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preselectedVehicleId]);

  const handleSelectVehicle = (id: string) => {
    setSelectedVehicleId(id);
    const v = vehicles.find((item) => item.id === id);
    if (v) {
      setMileageAtService(v.current_mileage?.toString() || '');
      if (v.oil_type) {
        setTelemetry((prev) => ({ ...prev, oilGrade: v.oil_type || prev.oilGrade }));
      }
    }
  };

  const handleSelectSpecialty = (specialtyId: string) => {
    setActiveSpecialtyId(specialtyId);
    const tmpl = INTERVENTION_TEMPLATES.find((t) => t.id === specialtyId);
    if (tmpl) {
      setDescription(tmpl.description_placeholder);
      setServiceType(tmpl.default_type);
      setLaborCost(tmpl.suggested_labor_cost.toString());
      setClientVisibleNotes(tmpl.client_notes_template);
      setInternalNotes(tmpl.internal_notes_template);

      // Reset checkpoints to 'ok'
      const initCheckpoints: Record<string, CheckpointStatus> = {};
      if (tmpl.checkpoints) {
        tmpl.checkpoints.forEach((c) => {
          initCheckpoints[c.id] = 'ok';
        });
      }
      setCheckpointStatus(initCheckpoints);
    }
  };

  const handleAddPart = (part: CatalogPart) => {
    setSelectedParts((prev) => {
      const existing = prev.find((p) => p.part_id === part.id);
      if (existing) {
        return prev.map((p) =>
          p.part_id === part.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [
        ...prev,
        {
          part_id: part.id,
          name: part.name,
          sku: part.sku,
          price: part.sale_price,
          unit: part.unit || 'u',
          quantity: 1,
        },
      ];
    });
  };

  const handleRemovePart = (partId: string) => {
    setSelectedParts((prev) => prev.filter((p) => p.part_id !== partId));
  };

  const handleUpdateQty = (partId: string, quantity: number) => {
    setSelectedParts((prev) =>
      prev.map((p) => (p.part_id === partId ? { ...p, quantity } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setFormError('Veuillez sélectionner un véhicule.');
      return;
    }
    if (!description.trim()) {
      setFormError('Veuillez renseigner la désignation des travaux.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    // Compile telemetry summary
    let telemetrySummary = '';
    if (activeSpecialtyId === 'oil_service') {
      telemetrySummary = `[Télémétrie Huile] Grade: ${telemetry.oilGrade} | Capacité: ${telemetry.oilCapacityLiters}L | RAZ Entretien: ${telemetry.serviceResetDone ? 'OUI' : 'NON'}`;
    } else if (activeSpecialtyId === 'injection_diesel') {
      telemetrySummary = `[Télémétrie Injection] Pression Rail: ${telemetry.railPressureBars} bar | Corrections Débits: Cyl1(${telemetry.injector1Correction}) Cyl2(${telemetry.injector2Correction}) Cyl3(${telemetry.injector3Correction}) Cyl4(${telemetry.injector4Correction})`;
    } else if (activeSpecialtyId === 'brakes_chassis') {
      telemetrySummary = `[Télémétrie Freinage] Plaquettes AV/AR: ${telemetry.frontPadsMm}mm / ${telemetry.rearPadsMm}mm | Disques AV/AR: ${telemetry.frontDiscsMm}mm / ${telemetry.rearDiscsMm}mm | T° Liquide: ${telemetry.brakeFluidBoilingTemp}`;
    } else if (activeSpecialtyId === 'exhaust_emissions') {
      telemetrySummary = `[Télémétrie Échappement & FAP] Suie: ${telemetry.sootLoadGrams}g | Pression Diff.: ${telemetry.diffPressureMbar} mbar | AdBlue: ${telemetry.adbluePouredLiters}L`;
    }

    let compiledClientNotes = clientVisibleNotes.trim();
    if (telemetrySummary) {
      compiledClientNotes = compiledClientNotes
        ? `${compiledClientNotes}\n\n${telemetrySummary}`
        : telemetrySummary;
    }

    // Compile quality checkpoints
    const activeTemplate = INTERVENTION_TEMPLATES.find((t) => t.id === activeSpecialtyId);
    if (activeTemplate && activeTemplate.checkpoints && activeTemplate.checkpoints.length > 0) {
      const formattedCheckpoints = activeTemplate.checkpoints
        .map((c) => {
          const st = checkpointStatus[c.id] || 'ok';
          const label =
            st === 'ok'
              ? '[CONFORME]'
              : st === 'warn'
              ? '[VIGILANCE]'
              : '[DÉFAUT / REMPLACÉ]';
          return `${label} ${c.label}`;
        })
        .join('\n');

      compiledClientNotes += `\n\nPoints de Contrôle Qualité :\n${formattedCheckpoints}`;
    }

    try {
      const payload: {
        vehicle_id: string;
        type: string;
        description: string;
        client_visible_notes?: string;
        internal_notes?: string;
        mileage_at_service: number;
        status: string;
        labor_cost: number;
        workers?: Array<{ worker_id: string; role_on_job: string; hours_spent: number }>;
      } = {
        vehicle_id: selectedVehicleId,
        type: serviceType,
        description: description.trim(),
        client_visible_notes: compiledClientNotes || undefined,
        internal_notes: internalNotes.trim() || undefined,
        mileage_at_service: parseInt(mileageAtService, 10) || 0,
        status,
        labor_cost: parseFloat(laborCost) || 0,
      };

      if (leadWorkerId) {
        payload.workers = [
          {
            worker_id: leadWorkerId,
            role_on_job: 'lead',
            hours_spent: parseFloat(workerHours) || 0.0,
          },
        ];
      }

      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Erreur lors de la création de l'intervention.");
        setSubmitting(false);
        return;
      }

      const actionId = data.action?.id || data.id;

      // Attach selected parts from inventory atomically
      if (selectedParts.length > 0 && actionId) {
        for (const p of selectedParts) {
          await fetch(`/api/actions/${actionId}/parts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ part_id: p.part_id, quantity: p.quantity }),
          });
        }
      }

      router.push(`/admin/actions/${actionId}`);
    } catch (err) {
      console.error(err);
      setFormError('Erreur de communication avec le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted font-medium">
          Préparation du formulaire d&apos;intervention...
        </p>
      </div>
    );
  }

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        title="Nouvel Ordre de Réparation"
        subtitle="Enregistrez une opération de maintenance, diagnostic ou révision atelier"
        breadcrumbs={[
          { label: 'Ordres de Réparation', href: '/admin/actions' },
          { label: 'Nouvelle Intervention' },
        ]}
      />

      {formError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {formError}
        </div>
      )}

      {/* Step 1: Vehicle selection */}
      <VehicleSelectStep
        vehicles={vehicles}
        selectedVehicleId={selectedVehicleId}
        onSelectVehicle={handleSelectVehicle}
        searchQuery={vehicleSearch}
        onSearchChange={setVehicleSearch}
        selectedVehicle={selectedVehicle}
      />

      {/* Step 2: Trade & service details with Telemetry & Checkpoints */}
      <ServiceDetailsStep
        activeSpecialtyId={activeSpecialtyId}
        onSelectSpecialty={handleSelectSpecialty}
        serviceType={serviceType}
        setServiceType={setServiceType}
        description={description}
        setDescription={setDescription}
        mileageAtService={mileageAtService}
        setMileageAtService={setMileageAtService}
        status={status}
        setStatus={setStatus}
        laborCost={laborCost}
        setLaborCost={setLaborCost}
        leadWorkerId={leadWorkerId}
        setLeadWorkerId={setLeadWorkerId}
        workerHours={workerHours}
        setWorkerHours={setWorkerHours}
        clientVisibleNotes={clientVisibleNotes}
        setClientVisibleNotes={setClientVisibleNotes}
        internalNotes={internalNotes}
        setInternalNotes={setInternalNotes}
        workers={workers}
        telemetry={telemetry}
        setTelemetry={setTelemetry}
        checkpointStatus={checkpointStatus}
        setCheckpointStatus={setCheckpointStatus}
      />

      {/* Step 3: Parts & accessories */}
      <PartsSelectionStep
        catalogParts={catalogParts}
        selectedParts={selectedParts}
        onAddPart={handleAddPart}
        onRemovePart={handleRemovePart}
        onUpdateQty={handleUpdateQty}
        laborCost={parseFloat(laborCost) || 0}
      />

      {/* Form Submission */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/actions')}
        >
          Annuler
        </Button>
        <Button type="submit" isLoading={submitting}>
          Valider & Ouvrir l&apos;Intervention
        </Button>
      </div>
    </form>
  );
}
