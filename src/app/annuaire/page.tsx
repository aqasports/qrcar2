'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ALGERIA_WILAYAS } from '@/lib/algeria-wilayas';
import { Button, Badge, Card, Spinner } from '@/components/ui';

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
    <div className="min-h-screen bg-surface-base text-text-primary font-sans">
      {/* Top Public Header */}
      <header className="border-b border-border-subtle bg-surface-raised/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center font-black text-white text-xs shadow-lg shadow-blue-600/30">
              GP
            </div>
            <span className="font-extrabold text-sm tracking-tight text-text-primary">Garage Pro Network</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/marketplace"
              className="text-xs font-bold text-text-muted hover:text-text-primary transition"
            >
              Marketplace Pièces
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Espace Pro Garagiste
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-14 px-6 border-b border-border-subtle bg-gradient-to-b from-surface-raised/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-extrabold uppercase tracking-wider">
            <span>Réseau Professionnel Certifié 58 Wilayas</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight leading-tight">
            Annuaire National des Garages & Experts Automobiles
          </h1>

          <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
            Trouvez les meilleurs spécialistes en diagnostic électronique, injection diesel, boîtes automatiques et reprogrammation à travers toute l&apos;Algérie.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-3xl mx-auto">
            <div className="sm:col-span-6 relative">
              <input
                type="text"
                placeholder="Rechercher par nom de garage, mot-clé, ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-raised border border-border-subtle rounded-2xl pl-10 pr-4 py-3 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
              <svg className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="sm:col-span-3">
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full bg-surface-raised border border-border-subtle rounded-2xl px-3 py-3 text-xs text-text-secondary focus:outline-none focus:border-accent"
              >
                <option value="all">Toutes les Wilayas (58)</option>
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w.code} value={w.code.toString()}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <Button type="submit" className="w-full h-full py-3" variant="primary" size="md">
                Rechercher
              </Button>
            </div>
          </form>

          {/* Specialty Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {SPECIALTIES.map((spec) => {
              const active = specialty === spec.id;
              return (
                <button
                  key={spec.id}
                  onClick={() => setSpecialty(spec.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-surface-raised/60 border-border-subtle text-text-muted hover:text-text-primary'
                  }`}
                >
                  {spec.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              Garages Disponibles ({garages.length})
            </h2>
            <p className="text-xs text-text-muted">Établissements partenaires équipés du passeport numérique PVC</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs text-text-muted">Recherche des ateliers en cours...</p>
          </div>
        ) : garages.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-surface-raised border border-border-subtle rounded-3xl p-12 max-w-lg mx-auto">
            <p className="text-sm font-bold text-text-primary">Aucun garage ne correspond à vos critères de recherche.</p>
            <p className="text-xs text-text-muted">Essayez d&apos;élargir la zone géographique ou de sélectionner toutes les spécialités.</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch('');
                setWilaya('all');
                setSpecialty('all');
              }}
            >
              Réinitialiser les Filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {garages.map((garage) => {
              const specs = Array.isArray(garage.specialties) ? garage.specialties : [];
              const brands = Array.isArray(garage.supported_brands) ? garage.supported_brands : [];

              return (
                <Card
                  key={garage.id}
                  variant="interactive"
                  className="p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                      {garage.logo_url ? (
                        <img
                          src={garage.logo_url}
                          alt={garage.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-border-subtle bg-surface-overlay shrink-0"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-base shrink-0 shadow-md border border-white/10"
                          style={{ backgroundColor: garage.brand_color_primary || '#0f172a' }}
                        >
                          {garage.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/annuaire/${garage.slug}`}
                          className="font-bold text-text-primary text-base hover:text-accent transition-colors block truncate"
                        >
                          {garage.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                          <span className="font-semibold text-text-secondary">{garage.city}</span>
                          <span>•</span>
                          <span>Wilaya {garage.wilaya}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {garage.bio && (
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {garage.bio}
                      </p>
                    )}

                    {/* Specialties */}
                    {specs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {specs.slice(0, 3).map((sp: string, idx: number) => (
                          <Badge key={idx} variant="info" size="sm">
                            {sp}
                          </Badge>
                        ))}
                        {specs.length > 3 && (
                          <span className="text-[10px] text-text-muted self-center">
                            +{specs.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Brands */}
                    {brands.length > 0 && (
                      <div className="flex flex-wrap gap-1 text-[10px] text-text-muted">
                        <span className="font-semibold">Marques :</span>
                        {brands.slice(0, 4).join(', ')}
                        {brands.length > 4 && <span>...</span>}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="pt-4 mt-6 border-t border-border-subtle flex items-center justify-between text-xs">
                    <span className="font-mono text-text-muted text-[11px] truncate max-w-[140px]">
                      {garage.phone || 'Non renseigné'}
                    </span>
                    <Link
                      href={`/annuaire/${garage.slug}`}
                      className="font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Fiche Complète</span>
                      <span>→</span>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
