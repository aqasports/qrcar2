'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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
        setError(data.error || 'Failed to fetch client details');
      } else {
        setClient(data.client);
        setVehicles(data.vehicles);
        // Sync edit fields
        setFullName(data.client.full_name);
        setPhone(data.client.phone);
        setEmail(data.client.email || '');
        setAddress(data.client.address || '');
        setNotes(data.client.notes || '');
      }
    } catch (err) {
      setError('Failed to load client profile.');
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
        setEditError(data.error || 'Failed to update client');
      } else {
        setClient(data);
        setIsEditing(false);
      }
    } catch (err) {
      setEditError('Failed to save changes.');
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
          year: parseInt(year),
          vin: vin || null,
          color: color || null,
          current_mileage: parseInt(mileage) || 0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVehicleError(data.error || 'Impossible d\'enregistrer le véhicule');
      } else {
        setShowVehicleModal(false);
        // Direct to vehicle page to link PVC card
        if (data.id) {
          router.push(`/admin/vehicles/${data.id}`);
        } else {
          fetchClientData();
        }
      }
    } catch (err) {
      setVehicleError('Failed to register. Please check your connection.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="text-slate-500 p-8 text-center">Loading client file...</div>;
  if (error) return <div className="text-red-400 p-8 text-center">{error}</div>;
  if (!client) return <div className="text-slate-500 p-8 text-center">Client not found</div>;

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/clients" className="text-slate-500 hover:text-slate-300 font-bold text-sm">
          &larr; Back to Clients
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client details card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-100">Owner Profile</h3>
            {role !== 'technician' && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-blue-500 hover:text-blue-400"
              >
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateClient} className="space-y-4">
              {editError && (
                <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 outline-none text-sm resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs py-2 font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs py-2 font-semibold text-slate-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Full Name</span>
                <span className="text-slate-200 font-semibold mt-0.5 block">{client.full_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Phone Number</span>
                <span className="text-slate-300 font-mono mt-0.5 block">{client.phone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Email Address</span>
                <span className="text-slate-300 mt-0.5 block">{client.email || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Postal Address</span>
                <span className="text-slate-300 mt-0.5 block whitespace-pre-wrap">{client.address || '—'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Internal Notes</span>
                <p className="text-slate-400 mt-0.5 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-850 whitespace-pre-wrap">{client.notes || 'No notes added.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Vehicles list card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-100">Registered Vehicles ({vehicles.length})</h3>
              {role !== 'technician' && (
                <button
                  onClick={() => {
                    setVehicleError('');
                    setShowVehicleModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 active:scale-[0.98]"
                >
                  + Ajouter un Véhicule pour ce Client
                </button>
              )}
            </div>

            {vehicles.length === 0 ? (
              <div className="text-slate-500 text-center py-12">No vehicles registered for this client yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div key={v.id} className="border border-slate-800/80 bg-slate-950/30 rounded-xl p-4 hover:border-slate-700/60 transition group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{v.make}</span>
                        <h4 className="font-bold text-slate-100 text-base leading-tight group-hover:text-blue-400 transition">{v.model}</h4>
                      </div>
                      <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2.5 py-1 rounded-lg border border-slate-750">{v.plate_number}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-4 border-t border-slate-850 pt-3">
                      <div>
                        <span className="text-slate-500 font-medium">Year:</span>
                        <span className="text-slate-300 font-semibold ml-1">{v.year}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Odometer:</span>
                        <span className="text-slate-300 font-semibold ml-1 font-mono">{v.current_mileage.toLocaleString()} km</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-850 flex justify-end">
                      <Link href={`/admin/vehicles/${v.id}`} className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1">
                        Vehicle File &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Vehicle Modal */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <h3 className="text-xl font-bold text-slate-100 mb-4">Register New Vehicle</h3>

            {vehicleError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {vehicleError}
              </div>
            )}

            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Plate Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 16-123-456"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Year</label>
                  <input
                    type="number"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Make</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Volkswagen"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Model</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Golf 7"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Grey"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Current Odometer (km)</label>
                  <input
                    type="number"
                    required
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">VIN (Chassis Number)</label>
                <input
                  type="text"
                  placeholder="Enter 17-digit VIN"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setShowVehicleModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-300 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-sm font-semibold disabled:opacity-50"
                >
                  {registering ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
