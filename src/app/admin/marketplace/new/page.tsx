'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ALGERIA_WILAYAS } from '@/lib/algeria-wilayas';

const CATEGORIES = [
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
  { id: 'new_oem', label: 'Neuf Origine Constructeur (OEM)' },
  { id: 'new_aftermarket', label: 'Neuf Adaptable Certifié' },
  { id: 'used_tested', label: 'Occasion Testée & Garantie' },
  { id: 'refurbished', label: 'Reconditionné Atelier' },
];

export default function NewMarketplaceListingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quotaDetails, setQuotaDetails] = useState<any>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    oem_number: '',
    category: 'motorisation',
    condition: 'used_tested',
    compatibility_makes: '',
    compatibility_models: '',
    compatibility_years: '',
    price: '',
    quantity: '1',
    location_wilaya: '16 - Alger',
    description: '',
  });

  useEffect(() => {
    async function checkPlan() {
      try {
        setLoading(true);
        const res = await fetch('/api/billing');
        if (res.ok) {
          const data = await res.json();
          setQuotaDetails(data?.details?.plan);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    checkPlan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la publication.');

      router.push('/admin/marketplace/my-listings');
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const maxListings = quotaDetails?.marketplaceListingsPerMonth ?? 0;
  const isStarterBlocked = maxListings === 0;

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Publier une Pièce sur la Marketplace</h1>
          <p className="text-sm text-slate-400 mt-1">
            Renseignez les détails techniques précis pour permettre aux confrères garagistes de trouver votre pièce.
          </p>
        </div>

        <Link
          href="/admin/marketplace"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
        >
          ← Retour au Catalogue
        </Link>
      </div>

      {/* Starter Plan Gating Alert */}
      {isStarterBlocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-amber-300 space-y-3">
          <div className="flex items-center gap-3 font-bold text-amber-400">
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Publication réservée aux forfaits Pro & Enterprise
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Votre forfait <strong>Starter</strong> vous permet de consulter et d&apos;acheter des pièces auprès des confrères. Pour vendre vos propres pièces et surplus de stock, passez au forfait <strong>Pro</strong> (20 annonces/mois) ou <strong>Enterprise</strong> (annonces illimitées).
          </p>
          <Link
            href="/admin/billing"
            className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Mettre à Niveau mon Forfait →
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {!isStarterBlocked && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Titre de l&apos;Annonce *
              </label>
              <input
                type="text"
                required
                placeholder="ex: Injecteur Bosch Common Rail 0445110369 1.5 dCi"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Référence OEM / Code Fabricant
              </label>
              <input
                type="text"
                placeholder="ex: 0445110369 ou 166006212R"
                value={formData.oem_number}
                onChange={(e) => setFormData({ ...formData, oem_number: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Catégorie *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">État de la Pièce *</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {CONDITIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Wilaya de Localisation *</label>
              <select
                value={formData.location_wilaya}
                onChange={(e) => setFormData({ ...formData, location_wilaya: e.target.value })}
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Marques Compatibles</label>
              <input
                type="text"
                placeholder="ex: Renault, Dacia, Nissan"
                value={formData.compatibility_makes}
                onChange={(e) => setFormData({ ...formData, compatibility_makes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Modèles & Motorisations</label>
              <input
                type="text"
                placeholder="ex: Clio 4, Duster, Megane 3 1.5 dCi K9K"
                value={formData.compatibility_models}
                onChange={(e) => setFormData({ ...formData, compatibility_models: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Prix de Vente (DZD) *</label>
              <input
                type="number"
                required
                placeholder="25000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantité Disponible</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description, Test sur Banc & Modalités de Garantie
              </label>
              <textarea
                rows={3}
                placeholder="ex: Injecteur testé sur banc d'essai Hartridge, débits conformes aux valeurs constructeur. Vendu avec rapport de test et garantie atelier 30 jours."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Link
              href="/admin/marketplace"
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
            >
              Annuler
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
            >
              {submitting ? 'Publication en cours...' : 'Publier l’Annonce'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
