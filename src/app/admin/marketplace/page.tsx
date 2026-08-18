'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ALGERIA_WILAYAS } from '@/lib/algeria-wilayas';

const CATEGORIES = [
  { id: 'all', label: 'Toutes les Catégories' },
  { id: 'motorisation', label: 'Moteur & Injection' },
  { id: 'freinage', label: 'Système de Freinage' },
  { id: 'transmission', label: 'Boîte & Transmission' },
  { id: 'suspension', label: 'Suspension & Direction' },
  { id: 'electronique', label: 'Électronique & Calculateurs' },
  { id: 'carrosserie', label: 'Carrosserie & Vitrage' },
  { id: 'eclairage', label: 'Optiques & Éclairage' },
  { id: 'climatisation', label: 'Climatisation & Chauffage' },
];

const CONDITIONS = [
  { id: 'all', label: 'Tous les états' },
  { id: 'new_oem', label: 'Neuf Origine Constructeur (OEM)' },
  { id: 'new_aftermarket', label: 'Neuf Adaptable Certifié' },
  { id: 'used_tested', label: 'Occasion Testée & Garantie' },
  { id: 'refurbished', label: 'Reconditionné Atelier' },
];

export default function MarketplaceBrowsePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [condition, setCondition] = useState('all');
  const [wilaya, setWilaya] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Inquiry modal
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState('');
  const [inquiryError, setInquiryError] = useState('');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      if (condition !== 'all') params.set('condition', condition);
      if (wilaya !== 'all') params.set('wilaya', wilaya);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);

      const res = await fetch(`/api/marketplace/listings?${params.toString()}`);
      if (!res.ok) throw new Error('Impossible de charger les annonces.');
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, condition, wilaya]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    try {
      setSendingInquiry(true);
      setInquiryError('');
      setInquirySuccess('');

      const res = await fetch('/api/marketplace/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: selectedListing.id,
          message: inquiryMsg,
          proposed_price: proposedPrice || null,
          buyer_phone: buyerPhone || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’envoi de la demande.');

      setInquirySuccess('Votre demande a été transmise instantanément à l’atelier vendeur !');
      setInquiryMsg('');
      setProposedPrice('');
    } catch (err: any) {
      setInquiryError(err.message || 'Erreur.');
    } finally {
      setSendingInquiry(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Marketplace Pièces Inter-Ateliers</h1>
          <p className="text-sm text-slate-400 mt-1">
            Recherchez et échangez des pièces auto, injecteurs, calculateurs et moteurs testés entre garages professionnels en Algérie.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/marketplace/inquiries"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>Demandes & Offres</span>
          </Link>

          <Link
            href="/admin/marketplace/my-listings"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Mes Annonces</span>
          </Link>

          <Link
            href="/admin/marketplace/new"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Publier une Pièce</span>
          </Link>
        </div>
      </div>

      {/* Advanced Search & Filtering Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <input
              type="text"
              placeholder="Recherche par Référence OEM (ex: 0445110), Titre, Marque (BMW, Renault), ou Modèle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Toutes les 58 Wilayas</option>
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <input
              type="number"
              placeholder="Prix Min DZD"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <span className="text-slate-600">-</span>
            <input
              type="number"
              placeholder="Prix Max DZD"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div className="md:col-span-5 flex items-center justify-end gap-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition"
            >
              Appliquer les Filtres
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('all');
                setCondition('all');
                setWilaya('all');
                setMinPrice('');
                setMaxPrice('');
                fetchListings();
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl text-xs font-semibold transition"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-semibold">Aucune pièce disponible avec ces critères de recherche.</p>
          <p className="text-xs text-slate-500 mt-1">Essayez d&apos;élargir votre recherche ou vérifiez la référence OEM.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const conditionBadge =
              item.condition === 'new_oem'
                ? { label: 'Neuf OEM', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
                : item.condition === 'refurbished'
                ? { label: 'Reconditionné', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
                : item.condition === 'used_tested'
                ? { label: 'Occasion Testée', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
                : { label: 'Adaptable Neuf', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };

            const isSpotlight = item.seller_directory_tier === 'spotlight';

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition ${
                  isSpotlight ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top Meta: OEM & Condition */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${conditionBadge.bg}`}
                    >
                      {conditionBadge.label}
                    </span>

                    {item.oem_number && (
                      <span className="font-mono text-[11px] bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-lg text-slate-300 font-bold">
                        OEM: {item.oem_number}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-100 text-base leading-snug line-clamp-2">{item.title}</h3>

                  {/* Compatibility Badges */}
                  {(item.compatibility_makes || item.compatibility_models) && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                      {item.compatibility_makes && (
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">
                          {item.compatibility_makes}
                        </span>
                      )}
                      {item.compatibility_models && (
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                          {item.compatibility_models}
                        </span>
                      )}
                      {item.compatibility_years && (
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                          {item.compatibility_years}
                        </span>
                      )}
                    </div>
                  )}

                  {item.description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2">{item.description}</p>
                  )}
                </div>

                {/* Seller & Price Footer */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <span>{item.seller_garage_name}</span>
                        {isSpotlight && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 rounded">
                            PRO
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block">
                        Wilaya : {item.location_wilaya}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black font-mono text-amber-400 block">
                        {parseFloat(item.price).toLocaleString('fr-FR')} DZD
                      </span>
                      <span className="text-[10px] text-slate-500">{item.quantity} dispo</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedListing(item);
                      setInquirySuccess('');
                      setInquiryError('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Contacter l&apos;Atelier / Faire une Offre</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inquiry Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Demande d&apos;Achat Direct
                </span>
                <h3 className="font-bold text-slate-100 text-base">{selectedListing.title}</h3>
                <p className="text-xs text-amber-400 font-mono font-bold mt-0.5">
                  Prix affiché : {parseFloat(selectedListing.price).toLocaleString('fr-FR')} DZD • Vendeur : {selectedListing.seller_garage_name} ({selectedListing.location_wilaya})
                </p>
              </div>

              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {inquirySuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-3">
                <p className="font-bold">{inquirySuccess}</p>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInquiry} className="space-y-4">
                {inquiryError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {inquiryError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Votre Message / Précisions techniques *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Bonjour confrère, la pièce est-elle disponible immédiatement ? Est-elle compatible avec un calculateur Bosch EDC17 ?"
                    value={inquiryMsg}
                    onChange={(e) => setInquiryMsg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Offre de Prix Proposée (DZD)
                    </label>
                    <input
                      type="number"
                      placeholder={selectedListing.price}
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Téléphone de Rappel
                    </label>
                    <input
                      type="tel"
                      placeholder="0550 12 34 56"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedListing(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={sendingInquiry || !inquiryMsg.trim()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50 shadow-lg shadow-blue-600/20"
                  >
                    {sendingInquiry ? 'Envoi...' : 'Transmettre l’Offre'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
