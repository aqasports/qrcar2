'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Appointment {
  id: string;
  vehicle_id: string;
  service_type: string;
  preferred_date: string;
  preferred_time_slot: string;
  current_mileage: number | null;
  notes: string | null;
  client_phone: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  garage_response: string | null;
  created_at: string;
  plate_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_current_mileage: number;
  client_id: string;
  client_name: string;
  client_phone_registered: string;
}

export default function AdminAppointmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Response modal state
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [responseStatus, setResponseStatus] = useState<'confirmed' | 'cancelled'>('confirmed');
  const [responseText, setResponseText] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId: string, status: string, responseNote?: string) => {
    setProcessingId(appointmentId);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          garage_response: responseNote || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setActionError(data.error || 'Impossible de mettre à jour le rendez-vous');
      } else {
        setActionSuccess('Statut du rendez-vous mis à jour avec succès.');
        setResponseModalOpen(false);
        fetchAppointments();
      }
    } catch (err) {
      setActionError('Erreur réseau lors de la mise à jour.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConvertToServiceAction = async (appointmentId: string) => {
    if (!confirm('Voulez-vous convertir ce rendez-vous en intervention atelier ouverte ?')) return;

    setProcessingId(appointmentId);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Échec de la conversion en intervention d'atelier");
      } else {
        setActionSuccess('Intervention créée avec succès.');
        if (data.action_id) {
          router.push(`/admin/actions/${data.action_id}`);
        } else {
          fetchAppointments();
        }
      }
    } catch (err) {
      setActionError('Erreur lors de la création de l\'intervention.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      app.client_name?.toLowerCase().includes(q) ||
      app.plate_number?.toLowerCase().includes(q) ||
      app.make?.toLowerCase().includes(q) ||
      app.model?.toLowerCase().includes(q) ||
      app.service_type?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-100">Rendez-Vous & Réservations</h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                {pendingCount} en attente
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les demandes de rendez-vous générées depuis les cartes QR clients ou saisies manuellement.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-medium flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{actionError}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500">Demandes en attente</span>
            <span className="text-2xl font-black text-amber-400 block mt-1">{pendingCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500">Rendez-vous confirmés</span>
            <span className="text-2xl font-black text-emerald-400 block mt-1">{confirmedCount}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500">Total Rendez-Vous</span>
            <span className="text-2xl font-black text-slate-100 block mt-1">{appointments.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'pending', label: 'En attente' },
            { id: 'confirmed', label: 'Confirmés' },
            { id: 'completed', label: 'Terminés' },
            { id: 'cancelled', label: 'Annulés' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition shrink-0 ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Rechercher par client, immatriculation, service..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
        />
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Chargement des rendez-vous...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <svg className="w-8 h-8 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-base font-bold text-slate-300">Aucun rendez-vous trouvé</p>
          <p className="text-xs text-slate-500">Les réservations scannées depuis les cartes PVC s&apos;afficheront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition space-y-4 ${
                app.status === 'pending'
                  ? 'border-amber-500/40 bg-amber-500/[0.02]'
                  : app.status === 'confirmed'
                  ? 'border-emerald-500/30 bg-emerald-500/[0.01]'
                  : 'border-slate-800'
              }`}
            >
              {/* Header: Service & Status */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Demande de prestation</span>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">{app.service_type}</h3>
                  <span className="text-xs text-blue-400 font-semibold block mt-0.5">
                    {new Date(app.preferred_date).toLocaleDateString()} &bull; {app.preferred_time_slot === 'morning' ? 'Matin (08h30-12h00)' : 'Après-midi (13h30-17h30)'}
                  </span>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                    app.status === 'confirmed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : app.status === 'completed'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : app.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                  }`}
                >
                  {app.status === 'pending' ? 'En attente' :
                   app.status === 'confirmed' ? 'Confirmé' :
                   app.status === 'completed' ? 'Effectué' : 'Annulé'}
                </span>
              </div>

              {/* Vehicle & Client Information */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-500 font-bold uppercase block text-[10px]">Client</span>
                  <Link href={`/admin/clients`} className="text-slate-200 font-semibold hover:text-blue-400 block mt-0.5">
                    {app.client_name}
                  </Link>
                  <span className="text-slate-400 font-mono block mt-0.5">{app.client_phone || app.client_phone_registered}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-bold uppercase block text-[10px]">Véhicule</span>
                  <Link href={`/admin/vehicles/${app.vehicle_id}`} className="text-slate-200 font-semibold hover:text-blue-400 block mt-0.5">
                    {app.make} {app.model} ({app.year})
                  </Link>
                  <span className="text-blue-400 font-mono font-bold block mt-0.5">{app.plate_number}</span>
                </div>
              </div>

              {/* Notes */}
              {app.notes && (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850 text-xs text-slate-300">
                  <span className="font-bold text-slate-400 block mb-0.5">Remarques Client :</span>
                  {app.notes}
                </div>
              )}

              {/* Garage Response */}
              {app.garage_response && (
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  <span className="font-bold block mb-0.5">Réponse Garage :</span>
                  {app.garage_response}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                {app.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedAppointment(app);
                        setResponseStatus('confirmed');
                        setResponseText('Votre rendez-vous a été validé par notre équipe. Nous vous attendons à l\'heure convenue.');
                        setResponseModalOpen(true);
                      }}
                      disabled={processingId === app.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      Confirmer le créneau
                    </button>

                    <button
                      onClick={() => {
                        setSelectedAppointment(app);
                        setResponseStatus('cancelled');
                        setResponseText('Créneau non disponible, merci de nous contacter pour convenir d\'une autre date.');
                        setResponseModalOpen(true);
                      }}
                      disabled={processingId === app.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 text-xs font-bold transition"
                    >
                      Refuser / Annuler
                    </button>
                  </>
                )}

                {(app.status === 'confirmed' || app.status === 'pending') && (
                  <button
                    onClick={() => handleConvertToServiceAction(app.id)}
                    disabled={processingId === app.id}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Convertir en Intervention Atelier</span>
                  </button>
                )}

                {app.status === 'completed' && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pris en charge en atelier</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation / Cancellation Modal */}
      {responseModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100">
              {responseStatus === 'confirmed' ? 'Confirmer le Rendez-Vous' : 'Refuser / Annuler le Rendez-Vous'}
            </h3>

            <p className="text-xs text-slate-400">
              Véhicule : <strong className="text-slate-200">{selectedAppointment.make} {selectedAppointment.model} ({selectedAppointment.plate_number})</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Message pour le client (visible lors du scan)
              </label>
              <textarea
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResponseModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(selectedAppointment.id, responseStatus, responseText)}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition ${
                  responseStatus === 'confirmed' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {responseStatus === 'confirmed' ? 'Confirmer' : 'Refuser'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
