'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ALGERIA_WILAYAS } from '@/lib/algeria-wilayas';

const SPECIALTIES = [
  { id: 'all', label: 'Toutes les Spécialités' },
  { id: 'diagnostic', label: 'Diagnostic Électronique' },
  { id: 'injection', label: 'Injection Diesel & Essence' },
  { id: 'boite_auto', label: 'Boîtes Auto & DSG' },
  { id: 'climatisation', label: 'Climatisation' },
  { id: 'reprogrammation', label: 'Reprogrammation Moteur' },
  { id: 'mecanique', label: 'Mécanique Générale' },
  { id: 'carrosserie', label: 'Carrosserie & Peinture' },
];

export default function PublicDirectoryPage() {
  const [garages, setGarages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wilaya, setWilaya] = useState('all');
  const [specialty, setSpecialty] = useState('all');

  const fetchDirectory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (wilaya !== 'all') params.set('wilaya', wilaya);
      if (specialty !== 'all') params.set('specialty', specialty);

      const res = await fetch(`/api/directory?${params.toString()}`);
      if (!res.ok) throw new Error('Impossible de charger l’annuaire.');
      const data = await res.json();
      setGarages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [wilaya, specialty]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDirectory();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Public Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-blue-600/30">
              GP
            </div>
            <span className="font-extrabold text-sm tracking-tight">Garage Pro Network</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/marketplace"
              className="text-xs font-bold text-slate-400 hover:text-slate-200 transition"
            >
              Marketplace Pièces
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Espace Pro Garagiste
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-14 px-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-wider">
            <span>Réseau Professionnel Certifié 58 Wilayas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            Annuaire National des Garages & Experts Automobiles
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Trouvez les meilleurs spécialistes en diagnostic électronique, injection diesel, boîtes automatiques et reprogrammation à travers toute l&apos;Algérie.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-3xl mx-auto">
            <div className="sm:col-span-6 relative">
              <input
                type="text"
                placeholder="Nom du garage, ville, marque (ex: BMW, Oran, Injection)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="sm:col-span-3">
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3 py-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">58 Wilayas</option>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition"
              >
                Trouver un Garage
              </button>
            </div>
          </form>

          {/* Specialties Quick Bar */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 pt-4">
            {SPECIALTIES.map((sp) => (
              <button
                key={sp.id}
                onClick={() => setSpecialty(sp.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  specialty === sp.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : garages.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <p className="text-base font-semibold">Aucun atelier trouvé pour cette recherche.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {garages.map((garage) => {
              const isSpotlight = garage.directory_tier === 'spotlight';
              const isFeatured = garage.directory_tier === 'featured';

              const specList = Array.isArray(garage.specialties)
                ? garage.specialties
                : typeof garage.specialties === 'string'
                ? JSON.parse(garage.specialties || '[]')
                : ['Diagnostic Électronique'];

              return (
                <div
                  key={garage.id}
                  className={`bg-slate-900 border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition ${
                    isSpotlight
                      ? 'border-amber-500/40 ring-1 ring-amber-500/30 bg-gradient-to-b from-amber-500/5 to-slate-900'
                      : isFeatured
                      ? 'border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-slate-900'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Tier Badge & Verification */}
                    <div className="flex items-center justify-between mb-4">
                      {isSpotlight ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                          Expert Spotlight
                        </span>
                      ) : isFeatured ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white">
                          Atelier Recommandé
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Atelier Certifié
                        </span>
                      )}

                      <span className="text-[11px] font-bold text-slate-400">
                        {garage.wilaya || 'Algérie'}
                      </span>
                    </div>

                    {/* Garage Title & Logo */}
                    <div className="flex items-start gap-3.5 mb-3">
                      {garage.logo_url ? (
                        <img
                          src={garage.logo_url}
                          alt={garage.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-800 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-sm shadow-md shrink-0"
                          style={{ backgroundColor: garage.brand_color_primary || '#2563eb' }}
                        >
                          {garage.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h3 className="font-extrabold text-slate-100 text-base leading-snug">
                          {garage.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{garage.city || garage.address}</p>
                      </div>
                    </div>

                    {garage.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {garage.description}
                      </p>
                    )}

                    {/* Specialties Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      {specList.slice(0, 3).map((sp: string) => (
                        <span
                          key={sp}
                          className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md font-medium capitalize"
                        >
                          {sp.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Stats */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200">{garage.solutions_count || 0}</span>
                        <span className="text-[11px] text-slate-500">solutions DTC</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-200">{garage.active_listings_count || 0}</span>
                        <span className="text-[11px] text-slate-500">pièces en vente</span>
                      </div>
                    </div>

                    <Link
                      href={`/annuaire/${garage.slug}`}
                      className="w-full block text-center py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition"
                    >
                      Consulter la Fiche & Coordonnées →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
