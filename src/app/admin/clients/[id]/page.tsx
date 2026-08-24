'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Modal,
  Button,
  Input,
  Textarea,
  Badge,
  Spinner,
} from '@/components/ui';

interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
}

interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  current_mileage: number;
}

export default function ClientDetailPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit client form state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // Register vehicle form state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [vin, setVin] = useState('');
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState('0');
  const [vehicleError, setVehicleError] = useState('');
  const [registering, setRegistering] = useState(false);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de récupérer les détails du client');
      } else {
        setClient(data.client);
        setVehicles(data.vehicles || []);

        setFullName(data.client.full_name);
        setPhone(data.client.phone);
        setEmail(data.client.email || '');
        setAddress(data.client.address || '');
        setNotes(data.client.notes || '');
      }
    } catch (err) {
      setError('Erreur lors du chargement de la fiche client.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email: email || null,
          address: address || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || 'Erreur lors de la mise à jour');
      } else {
        setClient(data.client);
        setIsEditing(false);
      }
    } catch (err) {
      setEditError('Erreur de communication.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setVehicleError('');

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          plate_number: plateNumber,
          make,
          model,
          year: parseInt(year, 10),
          vin: vin || null,
          color: color || null,
          current_mileage: parseInt(mileage, 10) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVehicleError(data.error || 'Erreur lors de l’enregistrement');
      } else {
        setShowVehicleModal(false);
        setPlateNumber('');
        setMake('');
        setModel('');
        setVin('');
        setColor('');
        setMileage('0');
        fetchClientData();
      }
    } catch (err) {
      setVehicleError('Erreur de communication.');
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm(`Supprimer définitivement la fiche client de ${client?.full_name} ?`)) return;
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/clients');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted font-medium">Chargement du dossier client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <p className="text-sm text-danger font-bold">{error || 'Client introuvable'}</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/admin/clients')}>
          Retour au répertoire
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title={client.full_name}
        subtitle="Dossier propriétaire et véhicules enregistrés"
        breadcrumbs={[
          { label: 'Clients', href: '/admin/clients' },
          { label: client.full_name },
        ]}
        actions={
          role !== 'technician' && (
            <div className="flex items-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setVehicleError('');
                  setShowVehicleModal(true);
                }}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Rattacher un Véhicule
              </Button>
              {(role === 'owner' || role === 'manager' || role === 'super_admin') && (
                <Button variant="danger" size="sm" onClick={handleDeleteClient}>
                  Supprimer
                </Button>
              )}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Contact Info */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Coordonnées du Client</CardTitle>
              {!isEditing && role !== 'technician' && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              )}
            </CardHeader>

            <CardContent>
              {isEditing ? (
                <form onSubmit={handleUpdateClient} className="space-y-4">
                  {editError && (
                    <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
                      {editError}
                    </div>
                  )}

                  <Input
                    label="Nom & Prénom"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />

                  <Input
                    label="Téléphone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <Input
                    label="Adresse"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  <Textarea
                    label="Remarques"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  <div className="flex gap-2.5 pt-3">
                    <Button type="submit" isLoading={saving} className="flex-1">
                      Enregistrer
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                      Téléphone
                    </span>
                    <span className="text-text-primary font-mono font-bold mt-0.5 block">
                      {client.phone}
                    </span>
                  </div>

                  <div className="border-t border-border-subtle pt-3">
                    <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                      Email
                    </span>
                    <span className="text-text-secondary mt-0.5 block">
                      {client.email || '—'}
                    </span>
                  </div>

                  <div className="border-t border-border-subtle pt-3">
                    <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                      Adresse
                    </span>
                    <span className="text-text-secondary mt-0.5 block">
                      {client.address || '—'}
                    </span>
                  </div>

                  {client.notes && (
                    <div className="border-t border-border-subtle pt-3">
                      <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                        Remarques & Notes
                      </span>
                      <p className="text-text-muted mt-1 leading-relaxed bg-surface-base p-3 rounded-xl border border-border-subtle whitespace-pre-wrap">
                        {client.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Owned Vehicles */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Véhicules Rattachés ({vehicles.length})</CardTitle>
            </CardHeader>

            <CardContent className="p-0 sm:p-0">
              <Table className="rounded-none border-0 shadow-none">
                <TableHeader>
                  <tr>
                    <TableHead>Immatriculation</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Kilométrage</TableHead>
                    <TableHead className="text-right">Dossier</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 ? (
                    <TableEmptyState
                      colSpan={5}
                      title="Aucun véhicule rattaché"
                      description="Ce client ne possède pour le moment aucun véhicule dans le parc de l'atelier."
                      action={
                        role !== 'technician' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setVehicleError('');
                              setShowVehicleModal(true);
                            }}
                          >
                            Rattacher un Véhicule
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
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/vehicles/${v.id}`}
                            className="text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                          >
                            Consulter Dossier
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title="Rattacher un Véhicule au Client"
        description={`Créer une fiche véhicule associée à ${client.full_name}`}
        size="lg"
      >
        <form onSubmit={handleRegisterVehicle} className="space-y-4">
          {vehicleError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {vehicleError}
            </div>
          )}

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
            <Input
              label="Couleur"
              placeholder="ex. Noir Métallisé"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <Input
              label="Numéro de Châssis (VIN)"
              placeholder="ex. VF1..."
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={registering} className="flex-1">
              Enregistrer le Véhicule
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowVehicleModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
