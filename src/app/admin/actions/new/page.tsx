'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { INTERVENTION_TEMPLATES, InterventionTemplate } from '@/lib/intervention-templates';

interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  current_mileage: number;
  client_id?: string;
  client_name: string;
  fuel_type?: string;
  transmission?: string;
  engine_spec?: string;
  oil_type?: string;
  tire_size?: string;
  vin?: string;
}

interface Worker {
  id: string;
  full_name: string;
  role: string;
  hourly_rate?: number;
}

interface CatalogPart {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity_in_stock: number;
  sale_price: number;
  unit: string;
}

export default function NewServiceActionPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVehicleId = searchParams.get('vehicle_id') || '';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [loading, setLoading] = useState(true);

  // Studio Workflow State
  const [activeSpecialtyId, setActiveSpecialtyId] = useState<string>('oil_service');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(preselectedVehicleId);
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Core Parameters State
  const [serviceType, setServiceType] = useState<'maintenance' | 'repair' | 'inspection' | 'other'>('maintenance');
  const [mileageAtService, setMileageAtService] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'open' | 'in_progress' | 'completed'>('in_progress');
  const [laborCost, setLaborCost] = useState('3000');
  const [clientVisibleNotes, setClientVisibleNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [leadWorkerId, setLeadWorkerId] = useState('');
  const [workerHours, setWorkerHours] = useState('1.5');

  // Trade Specific Telemetry & Checklist
  const [checkpointStatus, setCheckpointStatus] = useState<Record<string, 'ok' | 'warn' | 'fail'>>({});
  
  // Specific Telemetry Fields
  const [telemetry, setTelemetry] = useState({
    // Lube / Oil
    oilGrade: '5W-30 C3',
    oilCapacityLiters: '4.5',
    serviceResetDone: true,
    // Injection
    railPressureBars: '1600',
    dtcCodes: '',
    injector1Correction: '+0.1',
    injector2Correction: '-0.2',
    injector3Correction: '+0.1',
    injector4Correction: '-0.1',
    // Brakes
    frontPadsMm: '10',
    rearPadsMm: '8',
    frontDiscsMm: '24.2',
    rearDiscsMm: '11.8',
    brakeFluidBoilingTemp: '240°C',
    // Transmission
    clutchCondition: 'Neuf',
    gearboxOilGrade: '75W-80',
    // Exhaust / FAP
    sootLoadGrams: '4.2',
    diffPressureMbar: '12',
    egrCleaned: true,
    adbluePouredLiters: '10',
    // Tires
    frontLeftTreadMm: '7.5',
    frontRightTreadMm: '7.5',
    rearLeftTreadMm: '7.0',
    rearRightTreadMm: '7.0',
    alignmentDone: true,
    wheelTorqueNm: '120',
    // A/C
    gasType: 'R134a',
    gasMassGrams: '520',
    ventTempCelsius: '5.2',
  });

  // Selected Parts from Catalog
  const [selectedParts, setSelectedParts] = useState<{ part_id: string; quantity: number; name: string; price: number; sku: string; unit: string }[]>([]);
  const [partSearchQuery, setPartSearchQuery] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load all foundational data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [vRes, wRes, pRes] = await Promise.all([
          fetch('/api/vehicles'),
          fetch('/api/workers'),
          fetch('/api/parts')
        ]);
        const vData = await vRes.json();
        const wData = await wRes.json();
        const pData = await pRes.json();

        if (Array.isArray(vData)) {
          setVehicles(vData);
          if (preselectedVehicleId) {
            const match = vData.find(v => v.id === preselectedVehicleId);
            if (match) {
              setSelectedVehicleId(match.id);
              setMileageAtService(match.current_mileage.toString());
              if (match.oil_type) setTelemetry(t => ({ ...t, oilGrade: match.oil_type || '5W-30' }));
            }
          }
        }
        if (Array.isArray(wData)) setWorkers(wData.filter(w => w.active));
        if (Array.isArray(pData)) setParts(pData.filter(p => p.active));
      } catch (err) {
        console.error('Failed to load studio dependencies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preselectedVehicleId]);

  // Handle template selection
  const selectSpecialty = (specialtyId: string) => {
    setActiveSpecialtyId(specialtyId);
    const tpl = INTERVENTION_TEMPLATES.find(t => t.id === specialtyId);
    if (!tpl) return;

    setServiceType(tpl.default_type);
    setDescription(tpl.description_placeholder);
    setLaborCost(tpl.suggested_labor_cost.toString());
    setClientVisibleNotes(tpl.client_notes_template);
    setInternalNotes(tpl.internal_notes_template);

    // Reset checkpoints to 'ok' by default
    const initCheckpoints: Record<string, 'ok' | 'warn' | 'fail'> = {};
    tpl.checkpoints.forEach(c => {
      initCheckpoints[c.id] = 'ok';
    });
    setCheckpointStatus(initCheckpoints);
  };

  // When selected vehicle changes, sync mileage and specs
  const handleVehicleSelect = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find(item => item.id === vId);
    if (v) {
      setMileageAtService(v.current_mileage.toString());
      if (v.oil_type) {
        setTelemetry(t => ({ ...t, oilGrade: v.oil_type || '5W-30' }));
      }
    }
  };

  // Add Part to list
  const handleAddPart = (part: CatalogPart) => {
    if (selectedParts.some(p => p.part_id === part.id)) {
      setSelectedParts(prev => prev.map(p => p.part_id === part.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setSelectedParts(prev => [
        ...prev,
        {
          part_id: part.id,
          quantity: 1,
          name: part.name,
          price: part.sale_price,
          sku: part.sku,
          unit: part.unit
        }
      ]);
    }
  };

  // Remove Part from list
  const handleRemovePart = (partId: string) => {
    setSelectedParts(prev => prev.filter(p => p.part_id !== partId));
  };

  // Update Part Quantity
  const handleUpdatePartQty = (partId: string, qty: number) => {
    if (qty <= 0) {
      handleRemovePart(partId);
    } else {
      setSelectedParts(prev => prev.map(p => p.part_id === partId ? { ...p, quantity: qty } : p));
    }
  };

  // Submit Studio Action
  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!selectedVehicleId) {
      setFormError('Veuillez sélectionner un véhicule de la flotte.');
      setSubmitting(false);
      return;
    }

    if (!description.trim()) {
      setFormError('Veuillez renseigner la description détaillée des travaux.');
      setSubmitting(false);
      return;
    }

    const mileageNum = parseInt(mileageAtService, 10);
    if (isNaN(mileageNum) || mileageNum < 0) {
      setFormError('Kilométrage invalide.');
      setSubmitting(false);
      return;
    }

    // Format Telemetry & Checkpoints into clean notes
    const activeTemplate = INTERVENTION_TEMPLATES.find(t => t.id === activeSpecialtyId);
    let compiledClientNotes = clientVisibleNotes.trim();

    // Compile trade telemetry block
    let telemetrySummary = '';
    if (activeSpecialtyId === 'oil_service') {
      telemetrySummary = `[SPÉCIFICATIONS VIDANGE] Grade Huile: ${telemetry.oilGrade} | Volume: ${telemetry.oilCapacityLiters}L | R.A.Z Indicateur: Conforme`;
    } else if (activeSpecialtyId === 'injection_diesel') {
      telemetrySummary = `[DIAGNOSTIC INJECTION] Pression Rail: ${telemetry.railPressureBars} bars | Écarts Débits Cylindres: [1: ${telemetry.injector1Correction} | 2: ${telemetry.injector2Correction} | 3: ${telemetry.injector3Correction} | 4: ${telemetry.injector4Correction}] mg/cp`;
    } else if (activeSpecialtyId === 'brakes_chassis') {
      telemetrySummary = `[RELEVÉ FREINAGE] Plaquettes AV: ${telemetry.frontPadsMm}mm / AR: ${telemetry.rearPadsMm}mm | Disques AV: ${telemetry.frontDiscsMm}mm / AR: ${telemetry.rearDiscsMm}mm | T° Ébullition Liquide: ${telemetry.brakeFluidBoilingTemp}`;
    } else if (activeSpecialtyId === 'exhaust_emissions') {
      telemetrySummary = `[DÉPOLLUTION FAP/EGR] Charge Suie FAP: ${telemetry.sootLoadGrams}g | Pression Diff: ${telemetry.diffPressureMbar} mbar | Vanne EGR: Décalaminée & Opérationnelle`;
    } else if (activeSpecialtyId === 'tires_alignment') {
      telemetrySummary = `[PNEUMATIQUES & GÉOMÉTRIE] Sculptures AVG: ${telemetry.frontLeftTreadMm}mm | AVD: ${telemetry.frontRightTreadMm}mm | ARG: ${telemetry.rearLeftTreadMm}mm | ARD: ${telemetry.rearRightTreadMm}mm | Couple serrage: ${telemetry.wheelTorqueNm} Nm`;
    } else if (activeSpecialtyId === 'ac_climate') {
      telemetrySummary = `[CLIMATISATION] Fluide: ${telemetry.gasType} (${telemetry.gasMassGrams}g) | Température Aérateurs: ${telemetry.ventTempCelsius}°C`;
    }

    if (telemetrySummary) {
      compiledClientNotes = compiledClientNotes ? `${compiledClientNotes}\n\n${telemetrySummary}` : telemetrySummary;
    }

    // Compile checkpoints
    if (activeTemplate && activeTemplate.checkpoints.length > 0) {
      const formattedCheckpoints = activeTemplate.checkpoints.map(c => {
        const st = checkpointStatus[c.id] || 'ok';
        const symbol = st === 'ok' ? '[CONFORME]' : st === 'warn' ? '[VIGILANCE]' : '[DÉFAUT / REMPLACÉ]';
        return `${symbol} ${c.label}`;
      }).join('\n');

      compiledClientNotes += `\n\nPoints de Contrôle Qualité :\n${formattedCheckpoints}`;
    }

    try {
      const payload: any = {
        vehicle_id: selectedVehicleId,
        type: serviceType,
        description: description.trim(),
        mileage_at_service: mileageNum,
        status,
        labor_cost: parseFloat(laborCost) || 0.00,
        client_visible_notes: compiledClientNotes || null,
        internal_notes: internalNotes.trim() || null,
      };

      if (leadWorkerId) {
        payload.workers = [{ worker_id: leadWorkerId, role_on_job: 'lead', hours_spent: parseFloat(workerHours) || 0.0 }];
      }

      // 1. Create the Action
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la création de l\'intervention.');
        setSubmitting(false);
        return;
      }

      const actionId = data.id;

      // 2. Attach selected parts from inventory atomically
      if (selectedParts.length > 0) {
        for (const p of selectedParts) {
          await fetch(`/api/actions/${actionId}/parts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ part_id: p.part_id, quantity: p.quantity }),
          });
        }
      }

      // Navigate to the created action dossier
      router.push(`/admin/actions/${actionId}`);
    } catch (err) {
      setFormError('Erreur de transmission avec le serveur.');
      setSubmitting(false);
    }
  };

  const selectedVehicleObj = vehicles.find(v => v.id === selectedVehicleId);
  const activeTemplateObj = INTERVENTION_TEMPLATES.find(t => t.id === activeSpecialtyId);
  const filteredVehicles = vehicles.filter(v => 
    v.plate_number.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.make.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.client_name.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const partsSubtotal = selectedParts.reduce((acc, p) => acc + p.price * p.quantity, 0);
  const grandTotal = partsSubtotal + (parseFloat(laborCost) || 0);

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Initialisation du Studio d&apos;Intervention Atelier...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/actions" className="text-slate-400 hover:text-slate-200 text-xs font-bold transition">
              &larr; Retour au Journal
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 text-xs font-bold">Studio d&apos;Intervention Multi-Métiers</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Nouvel Ordre de Réparation & Fiche Atelier</h1>
          <p className="text-slate-400 text-xs mt-0.5">Configurez une intervention avec télémétrie dédiée par poste de travail mécanique</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/actions"
            className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
          >
            Annuler
          </Link>
          <button
            onClick={handleSubmitAction}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Validation en cours...' : 'Enregistrer & Valider l\'Intervention'}
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold">
          {formError}
        </div>
      )}

      {/* STEP 1: Specialty Workstation Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Sélectionner le Poste / Métier Spécialisé
          </span>
          <span className="text-xs text-slate-500 font-medium">9 Modèles Métiers Disponibles</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {INTERVENTION_TEMPLATES.map((tpl) => {
            const isSelected = activeSpecialtyId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => selectSpecialty(tpl.id)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-bold uppercase block tracking-wider ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                    {tpl.specialty}
                  </span>
                  <h3 className="text-xs font-bold mt-1 text-slate-100 leading-snug">{tpl.name}</h3>
                </div>
                {tpl.suggested_labor_cost > 0 && (
                  <span className="text-[10px] font-mono text-slate-400 mt-2 block">
                    MO suggérée : {tpl.suggested_labor_cost} DZD
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: Vehicle Selection & Fleet Telemetry */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              2. Véhicule Concerné & Kilométrage Compteur
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Associez le véhicule du client pour synchroniser l&apos;historique</p>
          </div>
          
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher immatriculation / client..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-1.5 text-slate-200 text-xs outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Sélectionner le Véhicule *
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => handleVehicleSelect(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
            >
              <option value="">-- Choisir un véhicule du parc client --</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} — {v.make} {v.model} ({v.year}) [{v.client_name || 'Stock'}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Kilométrage Compteur à l&apos;Entrée *
            </label>
            <input
              type="number"
              placeholder="ex: 125000"
              value={mileageAtService}
              onChange={(e) => setMileageAtService(e.target.value)}
              required
              min="0"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm outline-none transition"
            />
          </div>
        </div>

        {selectedVehicleObj && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Motorisation</span>
              <span className="font-semibold text-slate-200">{selectedVehicleObj.engine_spec || 'N/A'} ({selectedVehicleObj.fuel_type || 'Diesel'})</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Transmission</span>
              <span className="font-semibold text-slate-200 capitalize">{selectedVehicleObj.transmission || 'Manuelle'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Spécif. Huile</span>
              <span className="font-semibold text-blue-400 font-mono">{selectedVehicleObj.oil_type || '5W-30'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Pneumatiques</span>
              <span className="font-semibold text-slate-200 font-mono">{selectedVehicleObj.tire_size || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px] font-bold">Titulaire</span>
              <span className="font-semibold text-emerald-400">{selectedVehicleObj.client_name}</span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: Specialty Workstation Telemetry Station */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              3. Poste de Travail & Télémétrie : {activeTemplateObj?.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Saisie technique avancée selon les paramètres du poste métier</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase">
            Type : {serviceType}
          </span>
        </div>

        {/* Dynamic Telemetry Panel by Trade */}
        {activeSpecialtyId === 'oil_service' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              Paramètres de Lubrification & Filtration
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Norme & Viscosité Huile</label>
                <select
                  value={telemetry.oilGrade}
                  onChange={(e) => setTelemetry({ ...telemetry, oilGrade: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="5W-30 C3 / RN0720">5W-30 C3 (FAP Faible Teneur Cendres)</option>
                  <option value="5W-40 A3/B4">5W-40 Synthétique Haute Protection</option>
                  <option value="0W-20 / 0W-30 Eco">0W-20 / 0W-30 Haute Efficacité Énergétique</option>
                  <option value="10W-40 Semi-synthèse">10W-40 Semi-synthèse Standard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Volume Rempli (Litres)</label>
                <input
                  type="text"
                  value={telemetry.oilCapacityLiters}
                  onChange={(e) => setTelemetry({ ...telemetry, oilCapacityLiters: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">R.A.Z Indicateur Vidange</label>
                <button
                  type="button"
                  onClick={() => setTelemetry({ ...telemetry, serviceResetDone: !telemetry.serviceResetDone })}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition border ${
                    telemetry.serviceResetDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {telemetry.serviceResetDone ? 'Réinitialisation Effectuée [OK]' : 'En attente de RAZ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSpecialtyId === 'injection_diesel' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              Banc Diagnostic Électronique & Débits Injecteurs
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pression Rail (Bars)</label>
                <input
                  type="text"
                  value={telemetry.railPressureBars}
                  onChange={(e) => setTelemetry({ ...telemetry, railPressureBars: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Débit Cyl. 1</label>
                <input
                  type="text"
                  value={telemetry.injector1Correction}
                  onChange={(e) => setTelemetry({ ...telemetry, injector1Correction: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Débit Cyl. 2</label>
                <input
                  type="text"
                  value={telemetry.injector2Correction}
                  onChange={(e) => setTelemetry({ ...telemetry, injector2Correction: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Débit Cyl. 3</label>
                <input
                  type="text"
                  value={telemetry.injector3Correction}
                  onChange={(e) => setTelemetry({ ...telemetry, injector3Correction: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Débit Cyl. 4</label>
                <input
                  type="text"
                  value={telemetry.injector4Correction}
                  onChange={(e) => setTelemetry({ ...telemetry, injector4Correction: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeSpecialtyId === 'brakes_chassis' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              Mesures Épaisseurs Disques / Plaquettes & Point d&apos;Ébullition
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Plaquettes AV (mm)</label>
                <input
                  type="text"
                  value={telemetry.frontPadsMm}
                  onChange={(e) => setTelemetry({ ...telemetry, frontPadsMm: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Plaquettes AR (mm)</label>
                <input
                  type="text"
                  value={telemetry.rearPadsMm}
                  onChange={(e) => setTelemetry({ ...telemetry, rearPadsMm: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Disques AV (mm)</label>
                <input
                  type="text"
                  value={telemetry.frontDiscsMm}
                  onChange={(e) => setTelemetry({ ...telemetry, frontDiscsMm: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Disques AR (mm)</label>
                <input
                  type="text"
                  value={telemetry.rearDiscsMm}
                  onChange={(e) => setTelemetry({ ...telemetry, rearDiscsMm: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">T° Ébullition DOT4</label>
                <input
                  type="text"
                  value={telemetry.brakeFluidBoilingTemp}
                  onChange={(e) => setTelemetry({ ...telemetry, brakeFluidBoilingTemp: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeSpecialtyId === 'exhaust_emissions' && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-4">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              Dépollution, Régénération FAP & Circuit EGR
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Masse de Suie Résiduelle (Grammes)</label>
                <input
                  type="text"
                  value={telemetry.sootLoadGrams}
                  onChange={(e) => setTelemetry({ ...telemetry, sootLoadGrams: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pression Différentielle (mbar)</label>
                <input
                  type="text"
                  value={telemetry.diffPressureMbar}
                  onChange={(e) => setTelemetry({ ...telemetry, diffPressureMbar: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">AdBlue Appoint (Litres)</label>
                <input
                  type="text"
                  value={telemetry.adbluePouredLiters}
                  onChange={(e) => setTelemetry({ ...telemetry, adbluePouredLiters: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Description & Operation Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">
            Description des Opérations Effectuées *
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition resize-none"
          />
        </div>

        {/* Quality Checkpoints Checklist */}
        {activeTemplateObj && activeTemplateObj.checkpoints.length > 0 && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Contrôles Qualité Atelier ({activeTemplateObj.checkpoints.length} Points)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeTemplateObj.checkpoints.map((cp) => {
                const current = checkpointStatus[cp.id] || 'ok';
                return (
                  <div
                    key={cp.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{cp.category}</span>
                      <h4 className="text-xs font-semibold text-slate-200">{cp.label}</h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCheckpointStatus(prev => ({ ...prev, [cp.id]: 'ok' }))}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                          current === 'ok' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckpointStatus(prev => ({ ...prev, [cp.id]: 'warn' }))}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                          current === 'warn' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Vigilance
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckpointStatus(prev => ({ ...prev, [cp.id]: 'fail' }))}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition ${
                          current === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Remplacé
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* STEP 4: Live Inventory Parts & Workshop Labor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Parts Catalog Picker */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                4. Pièces Détachées & Fournitures Magasin
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Déduction automatique du stock atelier</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400">{partsSubtotal.toFixed(2)} DZD</span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Filtrer les pièces du magasin (nom, sku, catégorie)..."
              value={partSearchQuery}
              onChange={(e) => setPartSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none"
            />

            {/* Selected Parts List */}
            {selectedParts.length > 0 && (
              <div className="space-y-2 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pièces sélectionnées pour déduction :</span>
                {selectedParts.map((sp) => (
                  <div key={sp.part_id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-blue-500/20">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{sp.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{sp.sku} • {sp.price.toFixed(2)} DZD / {sp.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={sp.quantity}
                        onChange={(e) => handleUpdatePartQty(sp.part_id, parseInt(e.target.value) || 1)}
                        className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-center text-xs font-mono text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePart(sp.part_id)}
                        className="text-red-400 hover:text-red-300 font-bold p-1 text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Catalog list suggestions */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {parts
                .filter(p => p.name.toLowerCase().includes(partSearchQuery.toLowerCase()) || p.sku.toLowerCase().includes(partSearchQuery.toLowerCase()))
                .map((part) => (
                  <div
                    key={part.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-slate-850 transition"
                  >
                    <div>
                      <h4 className="text-xs font-medium text-slate-300">{part.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Stock: {part.quantity_in_stock} {part.unit} • {part.sale_price.toFixed(2)} DZD
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddPart(part)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[11px] font-bold transition"
                    >
                      + Ajouter
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Staff Assignment & Labor Costs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              5. Technicien Référent & Main d&apos;Œuvre
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Affectation au planning d&apos;atelier et calcul du forfait</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Technicien Responsable
              </label>
              <select
                value={leadWorkerId}
                onChange={(e) => setLeadWorkerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
              >
                <option value="">-- Non affecté / Équipe générale --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.full_name} ({w.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Temps Passé Estimé (Heures)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={workerHours}
                  onChange={(e) => setWorkerHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Forfait Main d&apos;Œuvre (HT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-slate-100 font-mono text-sm outline-none"
                />
              </div>
            </div>

            {/* Total Computation Summary Banner */}
            <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-400 block">Total Prévisionnel Devis</span>
                <span className="text-xs text-slate-400">Pièces ({partsSubtotal.toFixed(2)}) + M.O ({parseFloat(laborCost) || 0})</span>
              </div>
              <span className="text-xl font-extrabold font-mono text-blue-400">
                {grandTotal.toFixed(2)} DZD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 5: Public QR Notes vs Private Workshop Dossier */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            6. Carnet Numérique Client & Dossier Interne
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Séparez les observations publiques gravées sur la carte PVC QR des notes d&apos;atelier privées</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-emerald-400 mb-1.5">
              Notes Visibles sur le Carnet Numérique (QR Public)
            </label>
            <textarea
              rows={3}
              placeholder="Conseils au client, points de vigilance, prochaines échéances..."
              value={clientVisibleNotes}
              onChange={(e) => setClientVisibleNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-slate-200 text-xs outline-none transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1.5">
              Notes Internes Atelier (Strictement Confidentielles)
            </label>
            <textarea
              rows={3}
              placeholder="Détails de démontage, références fournisseurs, temps réel non facturé..."
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl px-3.5 py-2 text-slate-200 text-xs outline-none transition resize-none"
            />
          </div>
        </div>
      </div>

      {/* Final Action Submission Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <h4 className="text-sm font-bold text-slate-100">Prêt à valider l&apos;ordre de réparation ?</h4>
          <p className="text-xs text-slate-400">Le stock de pièces sera déduit et la fiche d&apos;intervention sera créée.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin/actions"
            className="flex-1 sm:flex-none text-center px-5 py-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-bold transition"
          >
            Annuler
          </Link>
          <button
            type="button"
            onClick={handleSubmitAction}
            disabled={submitting}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Enregistrement en cours...'
            ) : (
              <>
                <span>Créer l&apos;Ordre de Travaux Atelier</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
