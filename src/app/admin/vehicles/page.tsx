'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableLoadingState,
  TableEmptyState,
  Modal,
  Button,
  Input,
  Select,
  Badge,
} from '@/components/ui';

interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  current_mileage: number;
  client_name: string;
  client_id: string | null;
}

interface Client {
  id: string;
  full_name: string;
  phone: string;
}

export default function VehiclesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Vehicle Modal State
  const [showModal, setShowModal] = useState(false);
  const [clientId, setClientId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [mileage, setMileage] = useState('0');
  const [vin, setVin] = useState('');
  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState('diesel');
  const [transmission, setTransmission] = useState('manuelle');
  const [engineSpec, setEngineSpec] = useState('');
  const [oilType, setOilType] = useState('5W-30');
  const [tireSize, setTireSize] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decodingVin, setDecodingVin] = useState(false);
  const [vinMsg, setVinMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchVehicles = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
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

  const handleDecodeVin = async () => {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      setVinMsg({ type: 'error', text: 'Le numéro VIN doit comporter exactement 17 caractères.' });
      return;
    }

    try {
      setDecodingVin(true);
      setVinMsg(null);

      const res = await fetch(`/api/vin/decode?vin=${encodeURIComponent(cleanVin)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Impossible de décoder ce numéro VIN.');
      }

      if (data.make) setMake(data.make);
      if (data.model) setModel(data.model);
      if (data.year) setYear(data.year.toString());
      if (data.fuel_type) setFuelType(data.fuel_type.toLowerCase());
      if (data.transmission_style) {
        setTransmission(data.transmission_style.toLowerCase().includes('auto') ? 'automatique' : 'manuelle');
      }

      const engineParts = [
        data.engine_displacement_l ? `${data.engine_displacement_l}L` : '',
        data.horse_power ? `${data.horse_power} ch` : '',
        data.engine_cylinders ? `(${data.engine_cylinders} cyl.)` : '',
      ].filter(Boolean);

      if (engineParts.length > 0) {
        setEngineSpec(engineParts.join(' '));
      }

      setVinMsg({
        type: 'success',
        text: `Véhicule identifié : ${data.make || ''} ${data.model || ''} (${data.year || ''}) via ${data.source === 'cache' ? 'Cache Local' : 'NHTSA vPIC Global'}`,
      });
    } catch (err: any) {
      setVinMsg({ type: 'error', text: err.message || 'Erreur lors du décodage VIN.' });
    } finally {
      setDecodingVin(false);
    }
  };

  useEffect(() => {
    fetchVehicles(search);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!plateNumber.trim() || !make.trim() || !model.trim() || !year.trim()) {
      setFormError('Veuillez remplir l\'immatriculation, la marque, le modèle et l\'année.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId || null,
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la création du véhicule.');
      } else {
        setShowModal(false);
        setPlateNumber('');
        setMake('');
        setModel('');
        setVin('');
        setColor('');
        setEngineSpec('');
        setTireSize('');
        fetchVehicles(search);
      }
    } catch (err) {
      setFormError('Erreur de communication avec le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Parc & Flotte Automobile"
        subtitle="Répertoire technique des véhicules clients et historiques de maintenance"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Véhicules' },
        ]}
        actions={
          role !== 'technician' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError('');
                setVinMsg(null);
                setShowModal(true);
              }}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nouveau Véhicule
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <Input
            placeholder="Rechercher par immatriculation, marque, modèle ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Vehicles Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Immatriculation</TableHead>
            <TableHead>Véhicule</TableHead>
            <TableHead>Année</TableHead>
            <TableHead>Kilométrage</TableHead>
            <TableHead>Propriétaire Actuel</TableHead>
            <TableHead className="text-right">Dossier Technique</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement de la flotte automobile..." />
          ) : vehicles.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucun véhicule enregistré"
              description="Aucun véhicule ne correspond à votre recherche."
              action={
                role !== 'technician' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setFormError('');
                      setShowModal(true);
                    }}
                  >
                    Ajouter un Premier Véhicule
                  </Button>
                ) : null
              }
            />
          ) : (
            vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <Badge variant="info" size="md" className="font-mono">
                    {v.plate_number}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-text-primary">
                  {v.make} {v.model}
                </TableCell>
                <TableCell className="text-text-muted">{v.year}</TableCell>
                <TableCell className="font-mono font-bold text-text-secondary">
                  {v.current_mileage?.toLocaleString()} km
                </TableCell>
                <TableCell>
                  {v.client_id ? (
                    <Link
                      href={`/admin/clients/${v.client_id}`}
                      className="text-text-primary font-semibold hover:text-accent transition-colors"
                    >
                      {v.client_name}
                    </Link>
                  ) : (
                    <Badge variant="warning">Non Attribué</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/vehicles/${v.id}`}
                    className="inline-flex items-center text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                  >
                    Ouvrir Dossier
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* New Vehicle Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Ajouter un Nouveau Véhicule"
        description="Enregistrez une nouvelle fiche technique automobile dans la base de données atelier."
        size="lg"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* VIN Decoder Strip */}
          <div className="p-3.5 rounded-xl bg-surface-base border border-border-subtle space-y-2">
            <label className="block text-xs font-bold text-accent uppercase tracking-wider">
              Décodage Automatique par Numéro VIN
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex. VF1..."
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDecodeVin}
                isLoading={decodingVin}
              >
                Décoder VIN
              </Button>
            </div>
            {vinMsg && (
              <p className={`text-[11px] font-semibold ${vinMsg.type === 'success' ? 'text-emerald-400' : 'text-danger'}`}>
                {vinMsg.text}
              </p>
            )}
          </div>

          <Select
            label="Client Propriétaire (Optionnel)"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">-- Véhicule sans propriétaire assigné --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.phone})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Immatriculation"
              required
              placeholder="ex. 01234-116-16"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
            />
            <Input
              label="Kilométrage Actuel (km)"
              type="number"
              required
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Marque"
              required
              placeholder="ex. Renault"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            />
            <Input
              label="Modèle"
              required
              placeholder="ex. Clio 4"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <Input
              label="Année"
              type="number"
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Carburant"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
            >
              <option value="diesel">Diesel</option>
              <option value="essence">Essence</option>
              <option value="hybride">Hybride</option>
              <option value="electrique">Électrique</option>
              <option value="gpl">GPL</option>
            </Select>

            <Select
              label="Transmission"
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
            >
              <option value="manuelle">Manuelle</option>
              <option value="automatique">Automatique</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Motorisation"
              placeholder="ex. 1.5 dCi 85ch"
              value={engineSpec}
              onChange={(e) => setEngineSpec(e.target.value)}
            />
            <Input
              label="Huile Moteur"
              placeholder="ex. 5W-30 ACEA C3"
              value={oilType}
              onChange={(e) => setOilType(e.target.value)}
            />
            <Input
              label="Couleur"
              placeholder="ex. Gris Platine"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={submitting} className="flex-1">
              Créer la Fiche Véhicule
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
