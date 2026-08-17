'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import FlippablePvcCard from '@/components/FlippablePvcCard';

interface Client {
  id: string;
  full_name: string;
}

interface Vehicle {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  current_mileage: number;
  fuel_type?: string;
  transmission?: string;
  engine_spec?: string;
  oil_type?: string;
  tire_size?: string;
  next_service_mileage?: number | null;
  next_service_date?: string | null;
  next_inspection_date?: string | null;
}

interface PVC_Card {
  id: string;
  token: string;
  serial_label: string;
  status: string;
  linked_at: string;
}

interface ServiceAction {
  id: string;
  type: string;
  description: string;
  status: string;
  mileage_at_service: number;
  date_in: string;
  date_out: string | null;
}

export default function VehicleDetailPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activeCard, setActiveCard] = useState<PVC_Card | null>(null);
  const [actions, setActions] = useState<ServiceAction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit specs form state
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [transmission, setTransmission] = useState('Manuelle');
  const [engineSpec, setEngineSpec] = useState('');
  const [oilType, setOilType] = useState('5W-30 ACEA C3');
  const [tireSize, setTireSize] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [nextInspectionDate, setNextInspectionDate] = useState('');
  const [specsError, setSpecsError] = useState('');
  const [savingSpecs, setSavingSpecs] = useState(false);

  // Owner transfer form state
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [transferError, setTransferError] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // PVC Card link state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unassignedCards, setUnassignedCards] = useState<PVC_Card[]>([]);
  const [selectedCardToken, setSelectedCardToken] = useState('');
  const [linkingError, setLinkingError] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Log Action Form States
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<'repair' | 'maintenance' | 'inspection' | 'other'>('repair');
  const [logDescription, setLogDescription] = useState('');
  const [logClientNotes, setLogClientNotes] = useState('');
  const [logInternalNotes, setLogInternalNotes] = useState('');
  const [logMileage, setLogMileage] = useState('');
  const [logStatus, setLogStatus] = useState<'open' | 'in_progress' | 'completed'>('open');
  const [logLaborCost, setLogLaborCost] = useState('0.00');
  const [selectedLeadWorkerId, setSelectedLeadWorkerId] = useState('');
  const [selectedAssistWorkerIds, setSelectedAssistWorkerIds] = useState<string[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [logError, setLogError] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [workerSearch, setWorkerSearch] = useState('');

  const fetchVehicleData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to fetch vehicle details');
      } else {
        setVehicle(data.vehicle);
        setActiveCard(data.activeCard);
        setActions(data.actions);
        // Sync forms
        setPlateNumber(data.vehicle.plate_number);
        setMake(data.vehicle.make);
        setModel(data.vehicle.model);
        setYear(data.vehicle.year.toString());
        setVin(data.vehicle.vin || '');
        setColor(data.vehicle.color || '');
        setMileage(data.vehicle.current_mileage.toString());
        setFuelType(data.vehicle.fuel_type || 'Diesel');
        setTransmission(data.vehicle.transmission || 'Manuelle');
        setEngineSpec(data.vehicle.engine_spec || '');
        setOilType(data.vehicle.oil_type || '5W-30 ACEA C3');
        setTireSize(data.vehicle.tire_size || '');
        setNextServiceMileage(data.vehicle.next_service_mileage?.toString() || '');
        setNextServiceDate(data.vehicle.next_service_date ? data.vehicle.next_service_date.split('T')[0] : '');
        setNextInspectionDate(data.vehicle.next_inspection_date ? data.vehicle.next_inspection_date.split('T')[0] : '');
      }
    } catch (err) {
      setError('Failed to load vehicle profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsList = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnassignedCards = async () => {
    try {
      const res = await fetch('/api/cards?status=unassigned');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUnassignedCards(data);
        if (data.length > 0) {
          setSelectedCardToken(data[0].token);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkersList = async () => {
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAllWorkers(data.filter((w: any) => w.active));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicleData();
    if (role && role !== 'technician') {
      fetchUnassignedCards();
    }
  }, [vehicleId]);

  useEffect(() => {
    if (role && role !== 'technician') {
      fetchClientsList();
      fetchWorkersList();
    }
  }, [role]);

  const handleUpdateSpecs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSpecs(true);
    setSpecsError('');

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: plateNumber,
          make,
          model,
          year: parseInt(year),
          vin: vin || null,
          color: color || null,
          current_mileage: parseInt(mileage) || null,
          fuel_type: fuelType,
          transmission,
          engine_spec: engineSpec || null,
          oil_type: oilType || null,
          tire_size: tireSize || null,
          next_service_mileage: nextServiceMileage ? parseInt(nextServiceMileage) : null,
          next_service_date: nextServiceDate || null,
          next_inspection_date: nextInspectionDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSpecsError(data.error || 'Failed to update vehicle');
      } else {
        setVehicle({
          ...vehicle!,
          ...data
        });
        setIsEditingSpecs(false);
      }
    } catch (err) {
      setSpecsError('Failed to save specifications.');
    } finally {
      setSavingSpecs(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;
    setSubmittingTransfer(true);
    setTransferError('');

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_client_id: selectedClientId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTransferError(data.error || 'Failed to transfer ownership');
      } else {
        setIsTransferring(false);
        fetchVehicleData();
      }
    } catch (err) {
      setTransferError('Failed to submit ownership transfer.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const handleDetachOwnership = async () => {
    if (!confirm('Voulez-vous détacher ce véhicule de son propriétaire actuel ? Le véhicule passera en statut "En attente de nouveau propriétaire", et tout son historique ainsi que sa carte PVC resteront conservés.')) {
      return;
    }
    setSubmittingTransfer(true);
    setTransferError('');

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detach_pending_sale: true, reason: 'Véhicule vendu par le client' }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTransferError(data.error || 'Impossible de détacher le propriétaire.');
      } else {
        setIsTransferring(false);
        fetchVehicleData();
      }
    } catch (err) {
      setTransferError('Erreur réseau lors du détachement.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const handleLinkCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardToken) return;
    setIsLinking(true);
    setLinkingError('');

    try {
      const res = await fetch('/api/cards/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: selectedCardToken, vehicle_id: vehicleId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLinkingError(data.error || 'Failed to link QR card');
      } else {
        setShowLinkModal(false);
        fetchVehicleData();
      }
    } catch (err) {
      setLinkingError('Failed to link card.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleRevokeCard = async () => {
    if (!activeCard || !confirm('Are you sure you want to deactivate and revoke this QR card? This action is permanent and cannot be undone.')) {
      return;
    }
    setIsRevoking(true);

    try {
      const res = await fetch('/api/cards/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activeCard.token }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to revoke QR card');
      } else {
        fetchVehicleData();
      }
    } catch (err) {
      alert('Failed to revoke card. Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleLogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setLogError('');

    const workersList: { worker_id: string; role_on_job: 'lead' | 'assist' }[] = [];
    if (selectedLeadWorkerId) {
      workersList.push({ worker_id: selectedLeadWorkerId, role_on_job: 'lead' });
    }
    selectedAssistWorkerIds.forEach((id) => {
      if (id !== selectedLeadWorkerId) {
        workersList.push({ worker_id: id, role_on_job: 'assist' });
      }
    });

    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          type: logType,
          description: logDescription,
          client_visible_notes: logClientNotes || null,
          internal_notes: logInternalNotes || null,
          mileage_at_service: parseInt(logMileage) || 0,
          status: logStatus,
          labor_cost: parseFloat(logLaborCost) || 0.00,
          workers: workersList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLogError(data.error || 'Failed to log service action');
      } else {
        setShowLogModal(false);
        fetchVehicleData();
      }
    } catch (err) {
      setLogError('Failed to communicate with service action logger.');
    } finally {
      setIsLogging(false);
    }
  };

  if (loading) return <div className="text-slate-500 p-8 text-center">Loading vehicle file...</div>;
  if (error) return <div className="text-red-400 p-8 text-center">{error}</div>;
  if (!vehicle) return <div className="text-slate-500 p-8 text-center">Vehicle not found</div>;

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <Link href="/admin/vehicles" className="text-slate-500 hover:text-slate-300 font-bold text-sm">
          &larr; Back to Vehicles
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Specs & Owner Card */}
        <div className="space-y-6 lg:col-span-1">
          {/* Specifications */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-100">Specifications</h3>
              {role !== 'technician' && !isEditingSpecs && (
                <button
                  onClick={() => setIsEditingSpecs(true)}
                  className="text-xs font-bold text-blue-500 hover:text-blue-400"
                >
                  Edit Specs
                </button>
              )}
            </div>

            {isEditingSpecs ? (
              <form onSubmit={handleUpdateSpecs} className="space-y-4">
                {specsError && (
                  <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {specsError}
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1">Plate Number *</label>
                  <input
                    type="text"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Make *</label>
                    <input
                      type="text"
                      required
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Year *</label>
                    <input
                      type="number"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Odometer (km) *</label>
                    <input
                      type="number"
                      required
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Fuel Type</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Essence">Essence</option>
                      <option value="Hybride">Hybride</option>
                      <option value="Électrique">Électrique</option>
                      <option value="GPL">GPL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Transmission</label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    >
                      <option value="Manuelle">Manuelle</option>
                      <option value="Automatique">Automatique</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-1">Engine Specification</label>
                  <input
                    type="text"
                    placeholder="ex. 2.0 TDI 150ch, 1.5 dCi"
                    value={engineSpec}
                    onChange={(e) => setEngineSpec(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Recommended Oil</label>
                    <input
                      type="text"
                      placeholder="ex. 5W-30 ACEA C3"
                      value={oilType}
                      onChange={(e) => setOilType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Tire Size</label>
                    <input
                      type="text"
                      placeholder="ex. 205/55 R16"
                      value={tireSize}
                      onChange={(e) => setTireSize(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Color</label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">VIN (Chassis)</label>
                    <input
                      type="text"
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-mono"
                    />
                  </div>
                </div>
                <div className="border-t border-slate-800 pt-3 space-y-3">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Maintenance Targets</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-1">Next Service (km)</label>
                      <input
                        type="number"
                        placeholder="ex. 125000"
                        value={nextServiceMileage}
                        onChange={(e) => setNextServiceMileage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-xs font-bold mb-1">Next Service Date</label>
                      <input
                        type="date"
                        value={nextServiceDate}
                        onChange={(e) => setNextServiceDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Next Inspection Date (CT)</label>
                    <input
                      type="date"
                      value={nextInspectionDate}
                      onChange={(e) => setNextInspectionDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingSpecs}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs py-2.5 font-semibold disabled:opacity-50 transition"
                  >
                    {savingSpecs ? 'Saving...' : 'Save Specs'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingSpecs(false)}
                    className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs py-2.5 font-semibold text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Plate Number</span>
                  <span className="inline-block bg-slate-950 border border-slate-800 px-3 py-1 font-mono text-slate-200 rounded mt-1 font-bold">
                    {vehicle.plate_number}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Make</span>
                    <span className="text-slate-300 font-semibold mt-0.5 block">{vehicle.make}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Model</span>
                    <span className="text-slate-300 font-semibold mt-0.5 block">{vehicle.model}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Year</span>
                    <span className="text-slate-300 mt-0.5 block">{vehicle.year}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Odometer</span>
                    <span className="text-slate-300 font-mono font-bold mt-0.5 block">{vehicle.current_mileage.toLocaleString()} km</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Fuel / Engine</span>
                    <span className="text-slate-300 mt-0.5 block">{vehicle.fuel_type || 'Diesel'} {vehicle.engine_spec ? `(${vehicle.engine_spec})` : ''}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Transmission</span>
                    <span className="text-slate-300 mt-0.5 block">{vehicle.transmission || 'Manuelle'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Recommended Oil</span>
                    <span className="text-blue-400 font-mono mt-0.5 block text-xs">{vehicle.oil_type || '5W-30 ACEA C3'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Tires</span>
                    <span className="text-slate-300 font-mono mt-0.5 block text-xs">{vehicle.tire_size || '—'}</span>
                  </div>
                </div>
                <div className="border-t border-slate-850 pt-3">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">VIN (Chassis)</span>
                  <span className="text-slate-300 font-mono mt-0.5 block truncate text-xs">{vehicle.vin || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Owner details */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Propriétaire du Véhicule</h3>
              {role !== 'technician' && !isTransferring && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTransferError('');
                      setSelectedClientId(vehicle.client_id || '');
                      setIsTransferring(true);
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    {vehicle.client_id ? 'Changer' : 'Attribuer'}
                  </button>
                  {vehicle.client_id && (
                    <button
                      onClick={handleDetachOwnership}
                      disabled={submittingTransfer}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 disabled:opacity-50"
                    >
                      Déclarer Vendu
                    </button>
                  )}
                </div>
              )}
            </div>

            {isTransferring ? (
              <form onSubmit={handleTransferOwnership} className="space-y-4 pt-1">
                {transferError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {transferError}
                  </div>
                )}
                <div>
                  <label className="block text-slate-400 text-xs font-bold mb-2">Sélectionner le Client Propriétaire</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                    required
                  >
                    <option value="">-- Choisir un client dans le répertoire --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submittingTransfer}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs py-2.5 font-bold disabled:opacity-50 transition"
                  >
                    {submittingTransfer ? 'Enregistrement...' : 'Confirmer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTransferring(false)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-750 rounded-xl text-xs py-2.5 font-bold text-slate-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : vehicle.client_id ? (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Titulaire Actuel</span>
                  <Link href={`/admin/clients/${vehicle.client_id}`} className="text-sm font-bold text-slate-200 hover:text-blue-400 block mt-0.5">
                    {vehicle.client_name}
                  </Link>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Téléphone</span>
                  <span className="text-xs text-slate-300 font-mono block mt-0.5">{vehicle.client_phone || '—'}</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                <span className="text-xs font-bold text-amber-400 block">En attente de nouveau propriétaire</span>
                <p className="text-[11px] text-slate-400">
                  Ce véhicule a été détaché lors d&apos;une cession/vente. Son historique mécanique et sa carte PVC restent intacts.
                </p>
                {role !== 'technician' && (
                  <button
                    onClick={() => {
                      setTransferError('');
                      setSelectedClientId('');
                      setIsTransferring(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition mt-2"
                  >
                    Attribuer au Nouveau Propriétaire
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PVC Card & Actions List */}
        <div className="space-y-6 lg:col-span-2">
          {/* PVC QR Card Section */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Carte d&apos;Identité PVC Numérique</h3>
              {activeCard && role !== 'technician' && (
                <button
                  onClick={handleRevokeCard}
                  disabled={isRevoking}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {isRevoking ? 'Révocation...' : 'Révoquer la Carte'}
                </button>
              )}
            </div>

            {activeCard ? (
              <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-slate-850 rounded-xl">
                <FlippablePvcCard
                  token={activeCard.token}
                  serialLabel={activeCard.serial_label}
                  status={activeCard.status}
                  vehiclePlate={vehicle?.plate_number}
                  vehicleMakeModel={`${vehicle?.make} ${vehicle?.model} (${vehicle?.year})`}
                  size="md"
                  showControls={true}
                />
              </div>
            ) : (
              <div className="bg-slate-950/40 p-6 border border-slate-850 rounded-xl text-center space-y-3">
                <p className="text-slate-400 text-xs">Ce véhicule n&apos;est pas encore associé à une carte physique PVC.</p>
                {role !== 'technician' && (
                  <button
                    onClick={() => {
                      setLinkingError('');
                      fetchUnassignedCards();
                      setShowLinkModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/10 active:scale-[0.98] inline-flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    Associer une Carte PVC Vierge
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action History List */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100">Service History</h3>
              {role !== 'technician' && (
                <button
                  onClick={() => {
                    setLogError('');
                    setLogType('repair');
                    setLogDescription('');
                    setLogClientNotes('');
                    setLogInternalNotes('');
                    setLogMileage(vehicle?.current_mileage.toString() || '0');
                    setLogStatus('open');
                    setLogLaborCost('0.00');
                    setSelectedLeadWorkerId('');
                    setSelectedAssistWorkerIds([]);
                    setShowLogModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-blue-500/5 active:scale-[0.98]"
                >
                  Log Action
                </button>
              )}
            </div>

            {actions.length === 0 ? (
              <div className="text-slate-500 text-center py-12">No service actions logged for this vehicle.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Odometer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {actions.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-850/20 text-sm">
                        <td className="py-3 px-4 text-slate-400 font-medium">
                          {new Date(act.date_in).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-200 capitalize">
                          {act.type}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                          {act.description}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {act.mileage_at_service.toLocaleString()} km
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            act.status === 'completed' || act.status === 'invoiced'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : act.status === 'in_progress'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {act.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/admin/actions/${act.id}`}
                            className="text-xs font-bold text-blue-500 hover:text-blue-400"
                          >
                            Details &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Card Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Link PVC QR Card</h3>

            {linkingError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {linkingError}
              </div>
            )}

            {unassignedCards.length === 0 ? (
              <div className="space-y-4">
                <p className="text-slate-400 text-sm">
                  There are no unassigned cards left. Please generate a new batch of cards first.
                </p>
                <div className="flex justify-end pt-4 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-805 rounded-xl text-slate-400 hover:text-slate-300 font-semibold text-sm transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLinkCard} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Select Card (Serial)
                  </label>
                  <select
                    value={selectedCardToken}
                    onChange={(e) => setSelectedCardToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-slate-200 outline-none text-sm"
                  >
                    {unassignedCards.map((c) => (
                      <option key={c.token} value={c.token}>
                        {c.serial_label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-300 transition text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-sm font-semibold disabled:opacity-50"
                  >
                    {isLinking ? 'Linking...' : 'Link QR Card'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Log Action Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-100">Log New Service Action</h3>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            {logError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {logError}
              </div>
            )}

            <form onSubmit={handleLogAction} className="space-y-4">
              {/* SECTION 1: Vehicle & Details */}
              <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Action Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">
                      Action Type
                    </label>
                    <select
                      value={logType}
                      onChange={(e: any) => setLogType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-semibold"
                    >
                      <option value="repair">Repair</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inspection">Inspection</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">
                      Odometer at Service (km)
                    </label>
                    <input
                      type="number"
                      required
                      value={logMileage}
                      onChange={(e) => setLogMileage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-mono"
                    />
                    {logMileage !== '' && parseInt(logMileage) < (vehicle?.current_mileage || 0) && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-400">
                        ⚠️ Warning: Mileage is lower than the vehicle's last recorded mileage ({vehicle?.current_mileage.toLocaleString()} km).
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">
                      Status
                    </label>
                    {/* Visual Stepper Badge Select */}
                    <div className="flex gap-2 bg-slate-950 border border-slate-850 p-1.5 rounded-xl">
                      {(['open', 'in_progress', 'completed'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setLogStatus(s)}
                          className={`flex-1 text-[10px] font-bold uppercase py-1.5 rounded-lg transition ${
                            logStatus === s
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">
                      Labor Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={logLaborCost}
                      onChange={(e) => setLogLaborCost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-bold mb-1.5">
                    Description / Primary Issue
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    placeholder="Describe the repairs, maintenance performed, or inspection checks..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm resize-none"
                  />
                </div>
              </div>

              {/* SECTION 2: Notes Visual Distinction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Visible Notes Card */}
                <div className="bg-blue-950/10 border border-blue-900/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
                    <span>🌐</span>
                    <span>Client-Visible Notes</span>
                  </div>
                  <textarea
                    rows={3}
                    value={logClientNotes}
                    onChange={(e) => setLogClientNotes(e.target.value)}
                    placeholder="This comment is visible to clients on their invoice & history view..."
                    className="w-full bg-slate-950/80 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-xs resize-none"
                  />
                  <p className="text-[10px] text-slate-500">Public notes print on invoice PDF and client's mobile web file.</p>
                </div>

                {/* Internal Garage Notes Card */}
                <div className="bg-red-950/10 border border-red-900/20 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase tracking-wider">
                    <span>👁️‍🗨️</span>
                    <span>Internal Technical Notes</span>
                  </div>
                  <textarea
                    rows={3}
                    value={logInternalNotes}
                    onChange={(e) => setLogInternalNotes(e.target.value)}
                    placeholder="Diagnostics, parts sourcing comments, mechanical concerns..."
                    className="w-full bg-slate-950/80 border border-slate-850 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-xs resize-none"
                  />
                  <p className="text-[10px] text-slate-500 font-semibold text-red-500/80">🔒 STAFF ONLY: This note is never shown to the client.</p>
                </div>
              </div>

              {/* SECTION 3: People */}
              <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-850 pb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. People & Mechanics</h4>
                  {/* Search filter input */}
                  <input
                    type="text"
                    placeholder="Search staff by name or role..."
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-2.5 py-1 text-slate-200 outline-none text-xs w-full sm:w-48"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1.5">
                      Lead Mechanic
                    </label>
                    <select
                      value={selectedLeadWorkerId}
                      onChange={(e) => setSelectedLeadWorkerId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm font-semibold"
                    >
                      <option value="">-- Choose Lead (Optional) --</option>
                      {allWorkers
                        .filter((w) =>
                          w.full_name.toLowerCase().includes((workerSearch || '').toLowerCase()) ||
                          w.role.toLowerCase().includes((workerSearch || '').toLowerCase())
                        )
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.full_name} ({w.role})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1.5">
                      Assistant Mechanics
                    </label>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2">
                      {allWorkers.filter((w) =>
                        w.full_name.toLowerCase().includes((workerSearch || '').toLowerCase()) ||
                        w.role.toLowerCase().includes((workerSearch || '').toLowerCase())
                      ).length === 0 ? (
                        <p className="text-slate-500 text-xs">No matching staff found.</p>
                      ) : (
                        allWorkers
                          .filter((w) =>
                            w.full_name.toLowerCase().includes((workerSearch || '').toLowerCase()) ||
                            w.role.toLowerCase().includes((workerSearch || '').toLowerCase())
                          )
                          .map((w) => (
                            <label key={w.id} className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedAssistWorkerIds.includes(w.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAssistWorkerIds([...selectedAssistWorkerIds, w.id]);
                                  } else {
                                    setSelectedAssistWorkerIds(selectedAssistWorkerIds.filter((id) => id !== w.id));
                                  }
                                }}
                                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer"
                              />
                              {w.full_name} ({w.role})
                            </label>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom total & Submit */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-800/60 mt-6 bg-slate-950/20 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Estimated Labor Subtotal</span>
                  <span className="text-slate-100 font-bold font-mono text-xl block">
                    ${Number(logLaborCost || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-300 transition text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLogging}
                    className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl transition text-sm font-bold shadow-lg shadow-blue-500/10 disabled:opacity-50"
                  >
                    {isLogging ? 'Logging...' : 'Log Action'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
