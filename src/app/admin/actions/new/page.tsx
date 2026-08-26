'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Spinner,
} from '@/components/ui';
import { TemplateSelector, RepairOrderTemplateOption } from '@/components/repair-order/TemplateSelector';
import { RepairOrderLineItems, RepairOrderLineItem, CatalogPartOption } from '@/components/repair-order/RepairOrderLineItems';
import { CostBreakdownBar } from '@/components/repair-order/CostBreakdownBar';
import { VehicleLookupPanel } from '@/components/repair-order/VehicleLookupPanel';
import { TorqueSpecsPanel } from '@/components/repair-order/TorqueSpecsPanel';
import crypto from 'crypto';

interface VehicleOption {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year?: number;
  vin?: string | null;
  current_mileage?: number;
  fuel_type?: string | null;
  engine_spec?: string | null;
  oil_type?: string | null;
  tire_size?: string | null;
  client_name?: string | null;
}

interface WorkerOption {
  id: string;
  full_name: string;
  role: string;
  active?: boolean;
}

export default function NewRepairOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicle_id') || '';
  const preselectedTemplateParam = searchParams.get('template') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Data prerequisites
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [catalogParts, setCatalogParts] = useState<CatalogPartOption[]>([]);
  const [templates, setTemplates] = useState<RepairOrderTemplateOption[]>([]);

  // Selected State
  const [selectedVehicleId, setSelectedVehicleId] = useState(preselectedVehicleId);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Form Fields
  const [serviceType, setServiceType] = useState('maintenance');
  const [description, setDescription] = useState('');
  const [mileageAtService, setMileageAtService] = useState('');
  const [status, setStatus] = useState<'open' | 'in_progress' | 'completed'>('in_progress');
  const [laborCost, setLaborCost] = useState(3000);
  const [hasTax, setHasTax] = useState(true);
  const [taxRate, setTaxRate] = useState(19.0);

  // Workers
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerHours, setWorkerHours] = useState('1.5');
  const [workerRole, setWorkerRole] = useState<'lead' | 'assist'>('lead');

  // Line Items
  const [lineItems, setLineItems] = useState<RepairOrderLineItem[]>([]);

  // Quality Checkpoints
  const [checkpoints, setCheckpoints] = useState<Array<{ id: string; label: string; category: string; status: 'ok' | 'warn' | 'fail' }>>([]);

  // Notes
  const [clientVisibleNotes, setClientVisibleNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [vRes, wRes, pRes, tRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/workers'),
          fetch('/api/parts'),
          fetch('/api/repair-templates'),
        ]);

        const [vData, wData, pData, tData] = await Promise.all([
          vRes.json(),
          wRes.json(),
          pRes.json(),
          tRes.json(),
        ]);

        const rawV = vData?.data !== undefined ? vData.data : vData;
        const rawW = wData?.data !== undefined ? wData.data : wData;
        const rawP = pData?.data !== undefined ? pData.data : pData;
        const rawT = tData?.data !== undefined ? tData.data : tData;

        if (Array.isArray(rawV)) setVehicles(rawV);
        if (Array.isArray(rawW)) setWorkers(rawW.filter((w: WorkerOption) => w.active !== false));
        if (Array.isArray(rawP)) setCatalogParts(rawP);
        if (Array.isArray(rawT)) {
          setTemplates(rawT);

          // Apply preselected template if URL query provided
          if (preselectedTemplateParam) {
            const matched = rawT.find((tmpl: any) => tmpl.id === preselectedTemplateParam || tmpl.name.toLowerCase().includes(preselectedTemplateParam.toLowerCase()));
            if (matched) {
              handleApplyTemplate(matched);
            }
          }
        }

        // Apply preselected vehicle if provided
        if (preselectedVehicleId && Array.isArray(rawV)) {
          const found = rawV.find((v: VehicleOption) => v.id === preselectedVehicleId);
          if (found) {
            setSelectedVehicleId(found.id);
            setMileageAtService(String(found.current_mileage || ''));
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [preselectedVehicleId, preselectedTemplateParam]);

  const handleSelectVehicle = (v: VehicleOption) => {
    setSelectedVehicleId(v.id);
    setMileageAtService(String(v.current_mileage || ''));
  };

  const handleApplyTemplate = async (tmpl: RepairOrderTemplateOption | null) => {
    if (!tmpl) {
      // Blank
      setSelectedTemplateId(null);
      return;
    }

    setSelectedTemplateId(tmpl.id);
    setDescription(tmpl.description || tmpl.name);
    setServiceType(tmpl.category === 'repair' ? 'repair' : tmpl.category === 'inspection' ? 'inspection' : 'maintenance');
    setLaborCost(tmpl.default_labor_cost || 0);

    // Fetch full template with its line items
    try {
      const res = await fetch(`/api/repair-templates/${tmpl.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const fullTmpl = data.data;
        if (Array.isArray(fullTmpl.line_items)) {
          setLineItems(
            fullTmpl.line_items.map((item: any) => ({
              id: crypto.randomUUID(),
              name: item.name,
              description: item.description,
              item_type: item.item_type,
              unit_price: item.default_unit_price,
              quantity: item.default_quantity,
              unit: item.unit || 'u',
              linked_part_id: item.linked_part_id,
              linked_part_name: item.linked_part_name,
              linked_part_sku: item.linked_part_sku,
              linked_part_stock: item.linked_part_stock,
            }))
          );
        }

        if (Array.isArray(fullTmpl.checkpoints)) {
          setCheckpoints(
            fullTmpl.checkpoints.map((cp: any) => ({
              id: cp.id || crypto.randomUUID(),
              label: cp.label,
              category: cp.category || 'Contrôle',
              status: 'ok',
            }))
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Line Items Handlers
  const handleUpdateLineItem = (id: string, updates: Partial<RepairOrderLineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddLineItem = (item: Omit<RepairOrderLineItem, 'id'>) => {
    setLineItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  };

  // Cost Computations
  const servicesSubtotal = lineItems
    .filter((i) => i.item_type !== 'part')
    .reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

  const partsSubtotal = lineItems
    .filter((i) => i.item_type === 'part')
    .reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setFormError('Veuillez sélectionner un véhicule pour cet ordre de réparation.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!description.trim()) {
      setFormError('Veuillez renseigner la désignation des travaux.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    // Format Checkpoints into Client Notes if present
    let finalClientNotes = clientVisibleNotes.trim();
    if (checkpoints.length > 0) {
      const formattedCp = checkpoints
        .map((c) => {
          const tag = c.status === 'ok' ? '[CONFORME]' : c.status === 'warn' ? '[VIGILANCE]' : '[DÉFAUT / REMPLACÉ]';
          return `${tag} ${c.category} : ${c.label}`;
        })
        .join('\n');
      finalClientNotes = finalClientNotes
        ? `${finalClientNotes}\n\nPoints de Contrôle Qualité :\n${formattedCp}`
        : `Points de Contrôle Qualité :\n${formattedCp}`;
    }

    try {
      const payload: any = {
        vehicle_id: selectedVehicleId,
        type: serviceType,
        description: description.trim(),
        client_visible_notes: finalClientNotes || undefined,
        internal_notes: internalNotes.trim() || undefined,
        mileage_at_service: parseInt(mileageAtService, 10) || 0,
        status,
        labor_cost: laborCost,
        has_tax: hasTax,
        tax_rate: hasTax ? taxRate : 0.0,
        template_id: selectedTemplateId || undefined,
        quality_checkpoints: checkpoints,
        items: lineItems.map((itm, idx) => ({
          name: itm.name,
          description: itm.description,
          item_type: itm.item_type,
          quantity: itm.quantity,
          unit_price: itm.unit_price,
          unit: itm.unit || 'u',
          linked_part_id: itm.linked_part_id,
          unit_price_snapshot: itm.unit_price_snapshot,
          sort_order: idx,
        })),
      };

      if (selectedWorkerId) {
        payload.workers = [
          {
            worker_id: selectedWorkerId,
            role_on_job: workerRole,
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
        setFormError(data.error || 'Erreur lors de la création de l’ordre de réparation.');
        setSubmitting(false);
        return;
      }

      const actionId = data.data?.id || data.id;
      router.push(`/admin/actions/${actionId}`);
    } catch (err) {
      console.error(err);
      setFormError('Erreur de communication avec le serveur.');
      setSubmitting(false);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement de l'atelier...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-7xl mx-auto pb-24 font-sans">
      <PageHeader
        title="Créer un Ordre de Réparation (OR)"
        subtitle="Personnalisez vos actes, pièces et tarifs atelier avec prévisualisation des coûts en temps réel."
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Ordres de réparation', href: '/admin/actions' },
          { label: 'Nouvel OR' },
        ]}
      />

      {formError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {formError}
        </div>
      )}

      {/* Section 1: Vehicle & Client Selection */}
      <Card className="p-5 space-y-4 border border-border-default">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            1. Véhicule & Kilométrage
          </h3>
        </div>

        {/* Vehicle Search & Quick Select */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Rechercher et sélectionner le véhicule
            </label>
            <input
              type="text"
              placeholder="Rechercher par immatriculation, marque, modèle ou nom du client..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Quick Vehicle Dropdown List */}
          {vehicleSearch.trim() !== '' && (
            <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-surface-base border border-border-default rounded-xl">
              {vehicles
                .filter(
                  (v) =>
                    v.plate_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                    v.make.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                    v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                    (v.client_name && v.client_name.toLowerCase().includes(vehicleSearch.toLowerCase()))
                )
                .map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      handleSelectVehicle(v);
                      setVehicleSearch('');
                    }}
                    className="w-full p-2 rounded-lg text-left hover:bg-surface-hover transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold px-1.5 py-0.2 bg-surface-raised border border-border-subtle rounded text-accent">
                        {v.plate_number}
                      </span>
                      <span className="font-bold text-text-primary">
                        {v.make} {v.model}
                      </span>
                      {v.client_name && (
                        <span className="text-text-muted">({v.client_name})</span>
                      )}
                    </div>
                    <span className="font-mono text-text-muted text-[11px]">
                      {(v.current_mileage || 0).toLocaleString()} km
                    </span>
                  </button>
                ))}
            </div>
          )}

          {/* Selected Vehicle Card & VIN Specs */}
          {selectedVehicle && (
            <VehicleLookupPanel
              vehicle={selectedVehicle}
              onApplySpecs={(specs) => {
                if (specs.oil_type) {
                  setClientVisibleNotes((prev) => prev ? `${prev}\nHuile : ${specs.oil_type}` : `Huile : ${specs.oil_type}`);
                }
              }}
            />
          )}

          {/* Service Mileage & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Input
              type="number"
              label="Kilométrage à l'intervention (km)"
              value={mileageAtService}
              onChange={(e) => setMileageAtService(e.target.value)}
              placeholder="Ex: 125000"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Statut Initial de l'OR
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="open">En Attente / Ouvert</option>
                <option value="in_progress">En Cours de Travaux</option>
                <option value="completed">Travaux Terminés</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Type d'Intervention
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent capitalize"
              >
                <option value="maintenance">Entretien Périodique</option>
                <option value="repair">Réparation Mécanique</option>
                <option value="inspection">Contrôle / Diagnostic</option>
                <option value="other">Autre Prestation</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Section 2: Template Selector Carousel */}
      <TemplateSelector
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleApplyTemplate}
        currency="DZD"
      />

      {/* Section 3: Acts, Prestations & Pièces (Editable Table) */}
      <RepairOrderLineItems
        items={lineItems}
        onUpdateItem={handleUpdateLineItem}
        onRemoveItem={handleRemoveLineItem}
        onAddItem={handleAddLineItem}
        catalogParts={catalogParts}
        currency="DZD"
      />

      {/* Section 4: Vehicle Technical Specs & Torque Reference Drawer */}
      <TorqueSpecsPanel
        vehicleMake={selectedVehicle?.make}
        vehicleModel={selectedVehicle?.model}
        engineCode={selectedVehicle?.engine_spec}
      />

      {/* Section 5: Team & Time Tracking */}
      <Card className="p-5 space-y-4 border border-border-default">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Personnel Affecté & Description des Travaux
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Mécanicien / Technicien Principal
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">Non assigné / Équipe générale</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name} ({w.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Rôle sur l'Ordre de Réparation
            </label>
            <select
              value={workerRole}
              onChange={(e) => setWorkerRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="lead">Chef de Poste / Référent</option>
              <option value="assist">Assistant / Opérateur</option>
            </select>
          </div>

          <Input
            type="number"
            label="Temps Passé Estimé (Heures)"
            value={workerHours}
            onChange={(e) => setWorkerHours(e.target.value)}
            min="0.25"
            step="0.25"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Désignation Globale des Travaux
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ex: Révision complète 60 000 km avec vidange, remplacement plaquettes de frein avant et diagnostic valise..."
            required
            className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>
      </Card>

      {/* Section 6: Quality Checkpoints Inspection */}
      {checkpoints.length > 0 && (
        <Card className="p-5 space-y-4 border border-border-default">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Contrôle Qualité & Check-List Atelier ({checkpoints.length} points)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="p-3 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent block">
                    {cp.category}
                  </span>
                  <span className="text-xs text-text-primary font-medium block">
                    {cp.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setCheckpoints((prev) =>
                        prev.map((c) => (c.id === cp.id ? { ...c, status: 'ok' } : c))
                      )
                    }
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      cp.status === 'ok'
                        ? 'bg-success text-white shadow-sm'
                        : 'bg-surface-raised text-text-muted hover:text-text-primary'
                    }`}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCheckpoints((prev) =>
                        prev.map((c) => (c.id === cp.id ? { ...c, status: 'warn' } : c))
                      )
                    }
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      cp.status === 'warn'
                        ? 'bg-warning text-slate-900 shadow-sm'
                        : 'bg-surface-raised text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Vigilance
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCheckpoints((prev) =>
                        prev.map((c) => (c.id === cp.id ? { ...c, status: 'fail' } : c))
                      )
                    }
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      cp.status === 'fail'
                        ? 'bg-danger text-white shadow-sm'
                        : 'bg-surface-raised text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Défaut
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 7: Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Notes */}
        <Card className="p-4 space-y-2 border border-border-default">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
            <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Notes Visibles par le Client (Passeport QR / Facture)</span>
          </div>
          <textarea
            value={clientVisibleNotes}
            onChange={(e) => setClientVisibleNotes(e.target.value)}
            rows={3}
            placeholder="Conseils constructeur, prochaine échéance de vidange, recommandations..."
            className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </Card>

        {/* Internal Workshop Notes */}
        <Card className="p-4 space-y-2 border border-border-default">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
            <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            <span>Notes Internes Atelier (Strictement Confidentiel)</span>
          </div>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={3}
            placeholder="Observations mécaniques, état des filetages, outils spéciaux utilisés, couple appliqué..."
            className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </Card>
      </div>

      {/* Section 8: Cost Breakdown & Sticky Submit Footer */}
      <CostBreakdownBar
        servicesSubtotal={servicesSubtotal}
        partsSubtotal={partsSubtotal}
        laborCost={laborCost}
        onLaborChange={setLaborCost}
        hasTax={hasTax}
        onHasTaxChange={setHasTax}
        taxRate={taxRate}
        onTaxRateChange={setTaxRate}
        currency="DZD"
      />

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-base/95 backdrop-blur border-t border-border-default z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => router.push('/admin/actions')}
          >
            Annuler
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={submitting && status === 'open'}
              onClick={() => setStatus('open')}
            >
              Enregistrer Brouillon
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting && status !== 'open'}
              onClick={() => setStatus('in_progress')}
            >
              Valider & Ouvrir l'Ordre de Réparation →
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
