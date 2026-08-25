'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Badge, Card, Spinner } from '@/components/ui';

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
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data || !data.organization) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary flex items-center justify-center p-6 font-sans">
        <Card className="p-12 text-center max-w-md w-full space-y-4">
          <p className="text-base font-bold text-text-primary">Garage introuvable dans l&apos;annuaire officiel.</p>
          <Link href="/annuaire">
            <Button variant="primary" size="sm">
              ← Retour à l&apos;Annuaire
            </Button>
          </Link>
        </Card>
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
    <div className="min-h-screen bg-surface-base text-text-primary font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navbar */}
      <header className="border-b border-border-subtle bg-surface-raised/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/annuaire" className="text-xs font-bold text-text-muted hover:text-text-primary transition flex items-center gap-1.5">
            ← Annuaire National des Garages
          </Link>

          <Link href="/login">
            <Button variant="secondary" size="sm">
              Espace Pro
            </Button>
          </Link>
        </div>
      </header>

      {/* Garage Header Banner */}
      <div className="relative border-b border-border-subtle bg-gradient-to-b from-surface-raised via-surface-raised/40 to-surface-base py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            {garage.logo_url ? (
              <img
                src={garage.logo_url}
                alt={garage.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-border-subtle shadow-2xl shrink-0"
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
                <h1 className="text-2xl sm:text-4xl font-black text-text-primary tracking-tight">
                  {garage.name}
                </h1>
                {isSpotlight && (
                  <Badge variant="warning" size="sm">
                    Expert Spotlight
                  </Badge>
                )}
              </div>

              <p className="text-sm text-text-muted font-medium">
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
          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Présentation & Équipements de l&apos;Atelier
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {garage.description ||
                `${garage.name} est un centre automobile moderne équipé de bancs de test et valises de diagnostic constructeur. Nos techniciens certifiés assurent la maintenance préventive et curative de vos véhicules selon les normes constructeur.`}
            </p>

            {/* Specialties Badges */}
            <div className="pt-3 border-t border-border-subtle">
              <span className="text-[11px] font-bold uppercase text-text-muted block mb-2">Spécialités Techniques :</span>
              <div className="flex flex-wrap gap-2">
                {specList.map((sp: string) => (
                  <Badge key={sp} variant="info" size="sm">
                    {sp.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Brands Serviced */}
            <div className="pt-3 border-t border-border-subtle">
              <span className="text-[11px] font-bold uppercase text-text-muted block mb-2">Marques Prises en Charge :</span>
              <div className="flex flex-wrap gap-2">
                {brandsList.map((brand: string) => (
                  <span
                    key={brand}
                    className="px-3 py-1 rounded-xl bg-surface-base text-text-secondary border border-border-subtle text-xs font-medium"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Authored DTC Solutions */}
          {solutions && solutions.length > 0 && (
            <Card className="p-6 sm:p-8 space-y-4">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
                <span>Solutions & Diagnostics Partagés ({solutions.length})</span>
                <span className="text-[10px] text-accent font-semibold">Base de Connaissances</span>
              </h2>

              <div className="space-y-3">
                {solutions.map((sol: any) => (
                  <Link
                    key={sol.id}
                    href={`/admin/knowledgebase/${sol.id}`}
                    className="block p-4 rounded-2xl bg-surface-base border border-border-subtle hover:border-accent/40 transition"
                  >
                    <div className="font-bold text-text-primary text-xs hover:text-accent">
                      {sol.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted">
                      <span>{sol.make} {sol.model}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">{sol.upvotes_count} votes utiles</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Active Marketplace Parts */}
          {listings && listings.length > 0 && (
            <Card className="p-6 sm:p-8 space-y-4">
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center justify-between">
                <span>Pièces Détachées en Vente ({listings.length})</span>
                <span className="text-[10px] text-amber-400 font-semibold">Stock Atelier</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listings.map((part: any) => (
                  <div
                    key={part.id}
                    className="p-4 rounded-2xl bg-surface-base border border-border-subtle space-y-1.5"
                  >
                    <div className="font-bold text-text-primary text-xs line-clamp-1">{part.title}</div>
                    {part.oem_number && (
                      <span className="font-mono text-[10px] text-accent block">OEM: {part.oem_number}</span>
                    )}
                    <div className="font-mono font-bold text-amber-400 text-xs">
                      {parseFloat(part.price).toLocaleString('fr-FR')} DZD
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Opening Hours & Location Info */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
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
                <div key={key} className="flex justify-between py-1 border-b border-border-subtle text-text-secondary">
                  <span className="font-semibold text-text-muted">{day}</span>
                  <span className="font-mono text-text-primary">{hours[key] || '08:00 - 18:00'}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Localisation & Coordonnées
            </h3>
            <p className="text-text-secondary">{garage.address || 'Adresse atelier non renseignée'}</p>
            <p className="text-text-muted font-medium">{garage.city}, {garage.wilaya}</p>
            {garage.email && (
              <p className="text-accent font-mono text-[11px] pt-1">{garage.email}</p>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
