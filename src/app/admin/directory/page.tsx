'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ALGERIA_WILAYAS } from '@/lib/algeria-wilayas';

const ALL_SPECIALTIES = [
  { id: 'diagnostic', label: 'Diagnostic Électronique' },
  { id: 'injection', label: 'Injection Diesel & Essence' },
  { id: 'boite_auto', label: 'Boîtes Auto & DSG' },
  { id: 'climatisation', label: 'Climatisation' },
  { id: 'reprogrammation', label: 'Reprogrammation Moteur' },
  { id: 'mecanique', label: 'Mécanique Générale' },
  { id: 'carrosserie', label: 'Carrosserie & Peinture' },
];

export default function AdminDirectorySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState<any>({
    slug: '',
    name: '',
    description: '',
    specialties: ['diagnostic', 'mecanique'],
    brands_serviced: ['Renault', 'Volkswagen', 'Peugeot'],
    opening_hours: {
      sat: '08:00 - 17:00',
      sun: '08:00 - 18:00',
      mon: '08:00 - 18:00',
      tue: '08:00 - 18:00',
      wed: '08:00 - 18:00',
      thu: '08:00 - 18:00',
      fri: 'Fermé',
    },
    wilaya: '16 - Alger',
    city: 'Alger',
    address: '',
    phone: '',
    email: '',
    is_directory_listed: true,
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/directory-profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          ...data,
          specialties: Array.isArray(data.specialties) ? data.specialties : JSON.parse(data.specialties || '[]'),
          brands_serviced: Array.isArray(data.brands_serviced) ? data.brands_serviced : JSON.parse(data.brands_serviced || '[]'),
          opening_hours: data.opening_hours || {
            sat: '08:00 - 17:00',
            sun: '08:00 - 18:00',
            mon: '08:00 - 18:00',
            tue: '08:00 - 18:00',
            wed: '08:00 - 18:00',
            thu: '08:00 - 18:00',
            fri: 'Fermé',
          },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleToggleSpecialty = (id: string) => {
    setProfile((prev: any) => {
      const current = prev.specialties || [];
      const updated = current.includes(id)
        ? current.filter((s: string) => s !== id)
        : [...current, id];
      return { ...prev, specialties: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await fetch('/api/organization/directory-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      }

      setSuccess('Fiche annuaire mise à jour avec succès !');
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Fiche Annuaire Professionnel & SEO</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez votre visibilité sur l&apos;annuaire national public, vos spécialités techniques et vos horaires d&apos;accueil.
          </p>
        </div>

        {profile.slug && (
          <Link
            href={`/annuaire/${profile.slug}`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition flex items-center gap-2"
          >
            <span>Voir ma Fiche Publique</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        )}
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Toggle Listing */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Publication dans l&apos;Annuaire Public
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rendre votre atelier visible auprès des automobilistes et des confrères sur l&apos;annuaire national.
            </p>
          </div>
          <input
            type="checkbox"
            checked={profile.is_directory_listed}
            onChange={(e) => setProfile({ ...profile, is_directory_listed: e.target.checked })}
            className="w-5 h-5 rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
          />
        </div>

        {/* Profile Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description & Présentation de l&apos;Atelier (SEO)
            </label>
            <textarea
              rows={3}
              placeholder="Présentez vos compétences clés, vos équipements et certifications..."
              value={profile.description || ''}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Téléphone Public Client</label>
            <input
              type="tel"
              placeholder="0550 12 34 56"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email de Contact</label>
            <input
              type="email"
              placeholder="contact@garage.dz"
              value={profile.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Wilaya</label>
            <select
              value={profile.wilaya || '16 - Alger'}
              onChange={(e) => setProfile({ ...profile, wilaya: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={`${w.code} - ${w.name}`}>
                  {w.code} - {w.name} ({w.arName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Commune / Ville</label>
            <input
              type="text"
              placeholder="Bab Ezzouar"
              value={profile.city || ''}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Complète</label>
            <input
              type="text"
              placeholder="Route Nationale 5, en face de la station Naftal"
              value={profile.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Specialties Checkboxes */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Spécialités Techniques Déclarées
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_SPECIALTIES.map((sp) => {
              const isChecked = (profile.specialties || []).includes(sp.id);
              return (
                <button
                  type="button"
                  key={sp.id}
                  onClick={() => handleToggleSpecialty(sp.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                    isChecked
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {sp.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
