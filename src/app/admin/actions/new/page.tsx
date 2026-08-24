'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageHeader, Button, Spinner } from '@/components/ui';
import { VehicleSelectStep } from '@/components/actions/steps/VehicleSelectStep';
import { ServiceDetailsStep } from '@/components/actions/steps/ServiceDetailsStep';
import { PartsSelectionStep } from '@/components/actions/steps/PartsSelectionStep';
import { INTERVENTION_TEMPLATES } from '@/lib/intervention-templates';

export default function NewServiceActionPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicle_id') || '';

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [catalogParts, setCatalogParts] = useState<any[]>([]);
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

  // Selected Parts
  const [selectedParts, setSelectedParts] = useState<any[]>([]);

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
            }
          }
        }
        if (Array.isArray(wData)) setWorkers(wData.filter((w: any) => w.active));
        if (Array.isArray(pData)) setCatalogParts(pData);
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
    }
  };

  const handleAddPart = (part: any) => {
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

    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          type: serviceType,
          description,
          client_notes: clientVisibleNotes || undefined,
          internal_notes: internalNotes || undefined,
          mileage_at_service: parseInt(mileageAtService, 10) || 0,
          status,
          labor_cost: parseFloat(laborCost) || 0,
          lead_worker_id: leadWorkerId || undefined,
          parts: selectedParts.map((p) => ({
            part_id: p.part_id,
            quantity: p.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la création de l\'intervention.');
      } else {
        router.push(`/admin/actions/${data.action.id}`);
      }
    } catch (err) {
      setFormError('Erreur de communication avec le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted font-medium">Préparation du formulaire d&apos;intervention...</p>
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

      {/* Step 2: Trade & service details */}
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
        <Button
          type="submit"
          isLoading={submitting}
        >
          Valider & Ouvrir l&apos;Intervention
        </Button>
      </div>
    </form>
  );
}
