'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { INTERVENTION_TEMPLATES } from '@/lib/intervention-templates';

interface Action {
  id: string;
  vehicle_id: string;
  plate_number: string;
  make: string;
  model: string;
  client_name: string;
  type: 'repair' | 'maintenance' | 'inspection' | 'other';
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'invoiced';
  date_in: string;
  date_out: string | null;
  mileage_at_service: number;
}

export default function ActionsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchActions = async (status = '') => {
    setLoading(true);
    try {
      let url = '/api/actions';
      if (status) {
        url += `?status=${status}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        let filtered = data;
        if (status) {
          filtered = data.filter((a) => a.status === status);
        }
        setActions(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions(statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header & Trade Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Interventions & Travaux Atelier</h2>
          <p className="text-slate-400 text-sm mt-1">Journal des ordres de réparation, entretiens et modèles spécialisés</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filters */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === '' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'open' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Ouvert
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Terminé
            </button>
          </div>

          <Link
            href="/admin/actions/new"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/15 transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nouvel Ordre de Réparation
          </Link>
        </div>
      </div>

      {/* Specialty Trade Studio Quick Launchers */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
          Accès Rapide par Métier / Poste Atelier
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {INTERVENTION_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/admin/actions/new?template=${tpl.id}`}
              className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-border-subtle hover:border-blue-500/40 text-left transition group"
            >
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block group-hover:text-blue-400">
                {tpl.specialty}
              </span>
              <span className="text-xs font-bold text-slate-300 group-hover:text-white block mt-0.5 leading-tight truncate">
                {tpl.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Service Action Listing */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Chargement du journal d&apos;interventions...</div>
        ) : actions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-400">Aucune intervention enregistrée.</p>
            <p className="text-xs text-slate-500 mt-1">Ouvrez le Studio pour enregistrer une intervention ou utiliser un modèle spécialisé.</p>
            <Link
              href="/admin/actions/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-500/10"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Ouvrir le Studio d&apos;Intervention
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/30">
                  <th className="px-6 py-4">Date Entrée</th>
                  <th className="px-6 py-4">Véhicule</th>
                  <th className="px-6 py-4">Immatriculation</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Kilométrage</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {actions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-900/30 transition duration-100">
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(act.date_in).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                      <Link href={`/admin/vehicles/${act.vehicle_id}`} className="hover:text-blue-400 transition">
                        {act.make} {act.model}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-300">{act.plate_number}</td>
                    <td className="px-6 py-4 text-sm capitalize text-slate-300 font-semibold">{act.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-xs">{act.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{act.mileage_at_service.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-sm">
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
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/admin/actions/${act.id}`}
                        className="text-xs font-bold text-blue-500 hover:text-blue-400 transition"
                      >
                        Ouvrir Dossier &rarr;
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
  );
}
