'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner, Button } from '@/components/ui';
import { VehicleHeader } from '@/components/vehicles/VehicleHeader';
import { VehicleSpecsCard } from '@/components/vehicles/VehicleSpecsCard';
import { VehicleOwnerCard } from '@/components/vehicles/VehicleOwnerCard';
import { VehiclePvcCard } from '@/components/vehicles/VehiclePvcCard';
import { ServiceHistoryTable } from '@/components/vehicles/ServiceHistoryTable';
import { LinkCardModal } from '@/components/vehicles/LinkCardModal';
import { LogActionModal } from '@/components/vehicles/LogActionModal';

export default function VehicleDetailPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<any>(null);
  const [activeCard, setActiveCard] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [allWorkers, setAllWorkers] = useState<any[]>([]);
  const [unassignedCards, setUnassignedCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Specs form state
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

  // Ownership transfer state
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [transferError, setTransferError] = useState('');
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  // PVC Card state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedCardToken, setSelectedCardToken] = useState('');
  const [linkingError, setLinkingError] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Action log modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState('repair');
  const [logDescription, setLogDescription] = useState('');
  const [logClientNotes, setLogClientNotes] = useState('');
  const [logInternalNotes, setLogInternalNotes] = useState('');
  const [logMileage, setLogMileage] = useState('');
  const [logStatus, setLogStatus] = useState('open');
  const [logLaborCost, setLogLaborCost] = useState('0.00');
  const [selectedLeadWorkerId, setSelectedLeadWorkerId] = useState('');
  const [logError, setLogError] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const fetchVehicleData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de récupérer les détails du véhicule');
      } else {
        setVehicle(data.vehicle);
        setActiveCard(data.activeCard);
        setActions(data.actions || []);

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
      setError('Erreur lors du chargement du dossier technique.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsList = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (Array.isArray(data)) setClients(data);
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
        if (data.length > 0) setSelectedCardToken(data[0].token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkersList = async () => {
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      if (Array.isArray(data)) setAllWorkers(data.filter((w: any) => w.active));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicleData();
    if (role && role !== 'technician') {
      fetchUnassignedCards();
      fetchClientsList();
      fetchWorkersList();
    }
  }, [vehicleId, role]);

  const handleSaveSpecs = async (e: React.FormEvent) => {
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
          year: parseInt(year, 10),
          vin: vin || null,
          color: color || null,
          current_mileage: parseInt(mileage, 10) || 0,
          fuel_type: fuelType,
          transmission,
          engine_spec: engineSpec || null,
          oil_type: oilType,
          tire_size: tireSize || null,
          next_service_mileage: nextServiceMileage ? parseInt(nextServiceMileage, 10) : null,
          next_service_date: nextServiceDate || null,
          next_inspection_date: nextInspectionDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSpecsError(data.error || 'Erreur lors de la mise à jour des spécifications');
      } else {
        setVehicle(data.vehicle);
        setIsEditingSpecs(false);
      }
    } catch (err) {
      setSpecsError('Erreur de communication avec le serveur.');
    } finally {
      setSavingSpecs(false);
    }
  };

  const handleTransferOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingTransfer(true);
    setTransferError('');

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_client_id: selectedClientId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTransferError(data.error || 'Erreur lors de l’attribution');
      } else {
        setIsTransferring(false);
        fetchVehicleData();
      }
    } catch (err) {
      setTransferError('Erreur de communication.');
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const handleDetachOwnership = async () => {
    if (!confirm('Confirmez-vous la cession du véhicule ? Le propriétaire sera détaché mais le carnet reste intact.')) return;
    setSubmittingTransfer(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_client_id: null }),
      });
      if (res.ok) fetchVehicleData();
    } catch (err) {
      console.error(err);
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
        body: JSON.stringify({
          token: selectedCardToken,
          vehicle_id: vehicleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkingError(data.error || 'Erreur lors de l’association de la carte');
      } else {
        setShowLinkModal(false);
        fetchVehicleData();
        fetchUnassignedCards();
      }
    } catch (err) {
      setLinkingError('Erreur de communication.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleRevokeCard = async () => {
    if (!confirm('Voulez-vous vraiment révoquer ce passeport PVC ? La carte physique ne sera plus utilisable.')) return;
    setIsRevoking(true);
    try {
      const res = await fetch('/api/cards/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: activeCard.id }),
      });
      if (res.ok) {
        fetchVehicleData();
        fetchUnassignedCards();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleLogActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setLogError('');

    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          type: logType,
          description: logDescription,
          client_notes: logClientNotes || undefined,
          internal_notes: logInternalNotes || undefined,
          mileage_at_service: parseInt(logMileage, 10) || vehicle.current_mileage,
          status: logStatus,
          labor_cost: parseFloat(logLaborCost) || 0,
          lead_worker_id: selectedLeadWorkerId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLogError(data.error || 'Erreur lors de la création de l’intervention');
      } else {
        setShowLogModal(false);
        fetchVehicleData();
      }
    } catch (err) {
      setLogError('Erreur de communication.');
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!confirm(`Supprimer définitivement le véhicule ${vehicle?.plate_number} ? Cette action est irréversible.`)) return;
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/vehicles');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted font-medium">Chargement du dossier technique...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <p className="text-sm text-danger font-bold">{error || 'Véhicule introuvable'}</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/admin/vehicles')}>
          Retour à la flotte
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <VehicleHeader
        vehicle={vehicle}
        activeCardToken={activeCard?.token}
        onEditSpecs={() => setIsEditingSpecs(true)}
        onDeleteVehicle={handleDeleteVehicle}
        role={role}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Specs & Owner */}
        <div className="space-y-6 lg:col-span-1">
          <VehicleSpecsCard
            vehicle={vehicle}
            isEditing={isEditingSpecs}
            onStartEdit={() => setIsEditingSpecs(true)}
            onCancelEdit={() => setIsEditingSpecs(false)}
            onSaveSpecs={handleSaveSpecs}
            saving={savingSpecs}
            role={role}
            formState={{
              plateNumber,
              setPlateNumber,
              make,
              setMake,
              model,
              setModel,
              year,
              setYear,
              vin,
              setVin,
              color,
              setColor,
              mileage,
              setMileage,
              fuelType,
              setFuelType,
              transmission,
              setTransmission,
              engineSpec,
              setEngineSpec,
              oilType,
              setOilType,
              tireSize,
              setTireSize,
              nextServiceMileage,
              setNextServiceMileage,
              nextServiceDate,
              setNextServiceDate,
              nextInspectionDate,
              setNextInspectionDate,
              specsError,
            }}
          />

          <VehicleOwnerCard
            vehicle={vehicle}
            clients={clients}
            isTransferring={isTransferring}
            selectedClientId={selectedClientId}
            onSelectClientId={setSelectedClientId}
            onStartTransfer={() => {
              setTransferError('');
              setSelectedClientId(vehicle.client_id || '');
              setIsTransferring(true);
            }}
            onCancelTransfer={() => setIsTransferring(false)}
            onSubmitTransfer={handleTransferOwnership}
            onDetachOwnership={handleDetachOwnership}
            submitting={submittingTransfer}
            transferError={transferError}
            role={role}
          />
        </div>

        {/* Right Column: PVC Digital Passport & Service Actions */}
        <div className="space-y-6 lg:col-span-2">
          <VehiclePvcCard
            activeCard={activeCard}
            vehicle={vehicle}
            onOpenLinkModal={() => {
              setLinkingError('');
              fetchUnassignedCards();
              setShowLinkModal(true);
            }}
            onRevokeCard={handleRevokeCard}
            isRevoking={isRevoking}
            role={role}
          />

          <ServiceHistoryTable
            actions={actions}
            onLogAction={() => {
              setLogError('');
              setLogType('repair');
              setLogDescription('');
              setLogClientNotes('');
              setLogInternalNotes('');
              setLogMileage(vehicle.current_mileage?.toString() || '0');
              setLogStatus('open');
              setLogLaborCost('0.00');
              setSelectedLeadWorkerId('');
              setShowLogModal(true);
            }}
            role={role}
          />
        </div>
      </div>

      {/* Modals */}
      <LinkCardModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        unassignedCards={unassignedCards}
        selectedCardToken={selectedCardToken}
        onSelectToken={setSelectedCardToken}
        onSubmit={handleLinkCard}
        isLinking={isLinking}
        error={linkingError}
      />

      <LogActionModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSubmit={handleLogActionSubmit}
        isSubmitting={isLogging}
        error={logError}
        formState={{
          logType,
          setLogType,
          logDescription,
          setLogDescription,
          logClientNotes,
          setLogClientNotes,
          logInternalNotes,
          setLogInternalNotes,
          logMileage,
          setLogMileage,
          logStatus,
          setLogStatus,
          logLaborCost,
          setLogLaborCost,
          selectedLeadWorkerId,
          setSelectedLeadWorkerId,
          workers: allWorkers,
        }}
      />
    </div>
  );
}
