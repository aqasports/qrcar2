'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function GaragePublicProfilePage() {
  const { slug } = useParams() as { slug: string };

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch(`/api/directory/${slug}`);
        if (!res.ok) throw new Error('Profil garage introuvable.');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Erreur.');
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data || !data.organization) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md w-full space-y-4">
          <p className="text-base font-bold text-slate-200">Garage introuvable dans l&apos;annuaire officiel.</p>
          <Link
            href="/annuaire"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            ← Retour à l&apos;Annuaire
          </Link>
        </div>
      </div>
    );
  }

  const { organization: garage, solutions, listings } = data;
  const isSpotlight = garage.directory_tier === 'spotlight';

  const specList = Array.isArray(garage.specialties)
    ? garage.specialties
    : typeof garage.specialties === 'string'
    ? JSON.parse(garage.specialties || '[]')
    : ['Diagnostic Électronique', 'Mécanique Générale'];

  const brandsList = Array.isArray(garage.brands_serviced)
    ? garage.brands_serviced
    : typeof garage.brands_serviced === 'string'
    ? JSON.parse(garage.brands_serviced || '[]')
    : ['Toutes Marques'];

  const hours = garage.opening_hours || {
    mon: '08:00 - 18:00',
    tue: '08:00 - 18:00',
    wed: '08:00 - 18:00',
    thu: '08:00 - 18:00',
    fri: 'Fermé',
    sat: '08:00 - 17:00',
    sun: '08:00 - 18:00',
  };

  // Schema.org AutoRepair JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: garage.name,
    description: garage.description || `Atelier automobile certifié ${garage.name} à ${garage.city || garage.wilaya}`,
    telephone: garage.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: garage.address || '',
      addressLocality: garage.city || '',
      addressRegion: garage.wilaya || '',
      addressCountry: 'DZ',
    },
    geo: garage.gps_lat && garage.gps_lng ? {
      '@type': 'GeoCoordinates',
      latitude: parseFloat(garage.gps_lat),
      longitude: parseFloat(garage.gps_lng),
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/annuaire" className="text-xs font-bold text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5">
            ← Annuaire National des Garages
          </Link>

          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Espace Pro
          </Link>
        </div>
      </header>

      {/* Garage Header Banner */}
      <div className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/40 to-slate-950 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            {garage.logo_url ? (
              <img
                src={garage.logo_url}
                alt={garage.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-slate-700 shadow-2xl shrink-0"
              />
            ) : (
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center font-black text-2xl text-white shadow-2xl shrink-0"
                style={{ backgroundColor: garage.brand_color_primary || '#2563eb' }}
              >
                {garage.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
                  {garage.name}
                </h1>
                {isSpotlight && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                    Expert Spotlight
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-400 font-medium">
                {garage.address} • {garage.city} ({garage.wilaya})
              </p>

              <div className="flex items-center gap-2 pt-1 text-xs text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Atelier Professionnel Agréé Réseau Garage Pro</span>
              </div>
            </div>
          </div>

          {/* Quick Action Contact Button */}
          {garage.phone && (
            <a
              href={`tel:${garage.phone}`}
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/20 transition flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Appeler l&apos;Atelier : {garage.phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description, Solutions & Marketplace */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Présentation & Équipements de l&apos;Atelier
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {garage.description ||
                `${garage.name} est un centre automobile moderne équipé de bancs de test et valises de diagnostic constructeur. Nos techniciens certifiés assurent la maintenance préventive et curative de vos véhicules selon les normes constructeur.`}
            </p>

            {/* Specialties Badges */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-2">Spécialités Techniques :</span>
              <div className="flex flex-wrap gap-2">
                {specList.map((sp: string) => (
                  <span
                    key={sp}
                    className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold capitalize"
                  >
                    {sp.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Brands Serviced */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-2">Marques Prises en Charge :</span>
              <div className="flex flex-wrap gap-2">
                {brandsList.map((brand: string) => (
                  <span
                    key={brand}
                    className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Authored DTC Solutions */}
          {solutions && solutions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center justify-between">
                <span>Solutions & Diagnostics Partagés ({solutions.length})</span>
                <span className="text-[10px] text-blue-400 font-semibold">Base de Connaissances</span>
              </h2>

              <div className="space-y-3">
                {solutions.map((sol: any) => (
                  <Link
                    key={sol.id}
                    href={`/admin/knowledgebase/${sol.id}`}
                    className="block p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="font-bold text-slate-100 text-xs hover:text-blue-400">
                      {sol.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{sol.make} {sol.model}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{sol.upvotes_count} votes utiles</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active Marketplace Parts */}
          {listings && listings.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center justify-between">
                <span>Pièces Détachées en Vente ({listings.length})</span>
                <span className="text-[10px] text-amber-400 font-semibold">Stock Atelier</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listings.map((part: any) => (
                  <div
                    key={part.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                  >
                    <div className="font-bold text-slate-200 text-xs line-clamp-1">{part.title}</div>
                    {part.oem_number && (
                      <span className="font-mono text-[10px] text-blue-400 block">OEM: {part.oem_number}</span>
                    )}
                    <div className="font-mono font-bold text-amber-400 text-xs">
                      {parseFloat(part.price).toLocaleString('fr-FR')} DZD
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Opening Hours & Location Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Horaires d&apos;Ouverture
            </h3>

            <div className="space-y-2 text-xs">
              {[
                { day: 'Samedi', key: 'sat' },
                { day: 'Dimanche', key: 'sun' },
                { day: 'Lundi', key: 'mon' },
                { day: 'Mardi', key: 'tue' },
                { day: 'Mercredi', key: 'wed' },
                { day: 'Jeudi', key: 'thu' },
                { day: 'Vendredi', key: 'fri' },
              ].map(({ day, key }) => (
                <div key={key} className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                  <span className="font-semibold text-slate-400">{day}</span>
                  <span className="font-mono text-slate-200">{hours[key] || '08:00 - 18:00'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Localisation & Coordonnées
            </h3>
            <p className="text-slate-300">{garage.address || 'Adresse atelier non renseignée'}</p>
            <p className="text-slate-400 font-medium">{garage.city}, {garage.wilaya}</p>
            {garage.email && (
              <p className="text-blue-400 font-mono text-[11px] pt-1">{garage.email}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
