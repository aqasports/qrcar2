'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
          plate_number: plateNumber.trim().toUpperCase(),
          make: make.trim(),
          model: model.trim(),
          year: parseInt(year, 10),
          current_mileage: parseInt(mileage, 10) || 0,
          vin: vin.trim() || null,
          color: color.trim() || null,
          fuel_type: fuelType,
          transmission,
          engine_spec: engineSpec.trim() || null,
          oil_type: oilType.trim() || null,
          tire_size: tireSize.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de l\'enregistrement du véhicule.');
      } else {
        setShowModal(false);
        // Direct navigation to vehicle page to link PVC card immediately
        if (data.id) {
          router.push(`/admin/vehicles/${data.id}`);
        } else {
          fetchVehicles(search);
        }
      }
    } catch (err) {
      setFormError('Impossible de communiquer avec le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Parc Véhicules</h2>
          <p className="text-slate-400 text-sm mt-1">Répertoire et suivi technique des véhicules sous gestion</p>
        </div>

        {role !== 'technician' && (
          <button
            onClick={() => {
              setFormError('');
              fetchClients();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/10 transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Enregistrer un Véhicule
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher par immatriculation, marque, modèle ou nom du titulaire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition duration-150 text-sm font-medium"
        />
      </div>

      {/* Vehicles Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement du parc automobile...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-400">Aucun véhicule enregistré dans le répertoire.</p>
            <p className="text-xs text-slate-500 mt-1">Enregistrez un premier véhicule pour commencer à générer son carnet numérique.</p>
            {role !== 'technician' && (
              <button
                onClick={() => {
                  setFormError('');
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/10"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Enregistrer le premier véhicule
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/30">
                  <th className="px-6 py-4">Immatriculation</th>
                  <th className="px-6 py-4">Marque & Modèle</th>
                  <th className="px-6 py-4">Année</th>
                  <th className="px-6 py-4">Kilométrage</th>
                  <th className="px-6 py-4">Client Titulaire</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-850/30 transition duration-100">
                    <td className="px-6 py-4 text-sm font-mono text-slate-200">
                      <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded font-bold">
                        {v.plate_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                      <Link href={`/admin/vehicles/${v.id}`} className="hover:text-blue-400 transition">
                        {v.make} {v.model}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{v.year}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">{v.current_mileage.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {v.client_id ? (
                        <Link href={`/admin/clients/${v.client_id}`} className="hover:text-blue-400 transition underline decoration-dotted font-medium">
                          {v.client_name || 'Client'}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          En attente de cession
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/admin/vehicles/${v.id}`}
                        className="text-xs font-bold text-blue-500 hover:text-blue-400 transition"
                      >
                        Fiche Véhicule &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Enregistrer un Véhicule</h3>
                <p className="text-xs text-slate-400 mt-0.5">Créez le profil véhicule avant de lui associer sa carte PVC QR</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="mt-6 space-y-6">
              {/* Section 1: Propriétaire */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  1. Titulaire / Propriétaire
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                >
                  <option value="">-- Véhicule en stock / Sans propriétaire immédiat --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.phone})
                    </option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Aucun client enregistré. Vous pouvez lier le véhicule maintenant ou l&apos;attribuer plus tard.
                  </p>
                )}
              </div>

              {/* Section 2: Identification */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  2. Identification du Véhicule
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Plaque d&apos;Immatriculation *
                    </label>
                    <input
                      type="text"
                      placeholder="ex: 16-123-456 ou 00123-124-16"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm uppercase outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Kilométrage Actuel (Odomètre) *
                    </label>
                    <input
                      type="number"
                      placeholder="ex: 85000"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      required
                      min="0"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Marque *</label>
                    <input
                      type="text"
                      placeholder="ex: Volkswagen"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Modèle *</label>
                    <input
                      type="text"
                      placeholder="ex: Golf 7"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Année *</label>
                    <input
                      type="number"
                      placeholder="ex: 2018"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                      min="1950"
                      max={new Date().getFullYear() + 1}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">Numéro VIN / Châssis</label>
                      <button
                        type="button"
                        onClick={handleDecodeVin}
                        disabled={decodingVin || vin.trim().length !== 17}
                        className="text-[11px] font-bold text-blue-400 hover:text-blue-300 disabled:opacity-40 transition flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{decodingVin ? 'Décodage...' : 'Décoder (Auto-Fill)'}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="17 caractères ISO 3779"
                      value={vin}
                      onChange={(e) => {
                        setVin(e.target.value);
                        setVinMsg(null);
                      }}
                      maxLength={17}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm uppercase outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Couleur Carrosserie (Optionnel)</label>
                    <input
                      type="text"
                      placeholder="ex: Noir Métallisé"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                    />
                  </div>
                </div>

                {/* VIN Feedback Alert */}
                {vinMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      vinMsg.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {vinMsg.type === 'success' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                    <span>{vinMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Section 3: Spécifications Techniques & Fluides */}
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Spécifications Techniques & Fluides
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Motorisation</label>
                    <input
                      type="text"
                      placeholder="ex: 2.0 TDI 150ch"
                      value={engineSpec}
                      onChange={(e) => setEngineSpec(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Carburant</label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition capitalize"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="essence">Essence</option>
                      <option value="hybride">Hybride</option>
                      <option value="electrique">Électrique</option>
                      <option value="gpl">GPL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Boîte de Vitesse</label>
                    <select
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition capitalize"
                    >
                      <option value="manuelle">Manuelle</option>
                      <option value="automatique">Automatique</option>
                      <option value="dsg">DSG / Double Embrayage</option>
                      <option value="sequentielle">Séquentielle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Norme Huile Moteur</label>
                    <input
                      type="text"
                      placeholder="ex: 5W-30 (Norme 504.00/507.00)"
                      value={oilType}
                      onChange={(e) => setOilType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dimension Pneumatiques</label>
                    <input
                      type="text"
                      placeholder="ex: 225/45 R17 91W"
                      value={tireSize}
                      onChange={(e) => setTireSize(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-blue-500/10 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    'Enregistrement en cours...'
                  ) : (
                    <>
                      <span>Enregistrer et Associer une Carte PVC</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-5 rounded-xl text-sm font-bold transition duration-150"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
