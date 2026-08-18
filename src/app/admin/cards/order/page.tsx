'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ALGERIA_WILAYAS, VOLUME_TIERS } from '@/lib/algeria-wilayas';

export default function CardOrderPage() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');
  const canceledParam = searchParams.get('canceled');

  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [designs, setDesigns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(100);
  const [shippingData, setShippingData] = useState({
    recipient_name: '',
    phone: '',
    wilaya: '16 - Alger',
    commune_address: '',
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch approved designs
      const designsRes = await fetch('/api/cards/designs');
      if (designsRes.ok) {
        const dList = await designsRes.json();
        const approved = dList.filter((d: any) => d.status === 'approved');
        setDesigns(approved);
        if (approved.length > 0) {
          setSelectedDesignId(approved[0].id);
        }
      }

      // Fetch existing orders
      const ordersRes = await fetch('/api/cards/orders');
      if (ordersRes.ok) {
        const oList = await ordersRes.json();
        setOrders(oList);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentTier =
    VOLUME_TIERS.find((t) => t.quantity === selectedQuantity) || VOLUME_TIERS[1];
  const totalPrice = selectedQuantity * currentTier.unitPrice;
  const selectedDesign = designs.find((d) => d.id === selectedDesignId);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesignId) {
      setError('Veuillez sélectionner un modèle de carte validé.');
      return;
    }

    try {
      setOrdering(true);
      setError('');

      const res = await fetch('/api/cards/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_design_id: selectedDesignId,
          quantity: selectedQuantity,
          shipping_address: `${shippingData.recipient_name} - ${shippingData.commune_address}`,
          shipping_wilaya: shippingData.wilaya,
          shipping_phone: shippingData.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la commande.');
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      setError(err.message || 'Erreur.');
      setOrdering(false);
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
    <div className="space-y-8 font-sans max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Commande de Cartes PVC Physiques</h1>
          <p className="text-sm text-slate-400 mt-1">
            Impression professionnelle offset 300 DPI, puces NFC sans contact et livraison sécurisée 58 Wilayas (Yalidine / ZR Express).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/cards/studio"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Ouvrir le Studio Design
          </Link>
          <Link
            href="/admin/cards"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
          >
            ← Retour aux Cartes
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successParam && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Paiement de la commande confirmé !</p>
            <p className="text-xs text-emerald-400/80">Votre lot de cartes PVC entre en production d&apos;impression. Vous recevrez le numéro de suivi dès expédition.</p>
          </div>
        </div>
      )}

      {canceledParam && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm flex items-center gap-3">
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Paiement interrompu. Votre commande reste enregistrée en attente de règlement.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* No Approved Design Warning */}
      {designs.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-amber-300 space-y-3">
          <div className="flex items-center gap-3 font-bold text-amber-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Aucun modèle de carte validé pour l&apos;impression
          </div>
          <p className="text-xs leading-relaxed text-slate-300">
            Pour commander un tirage physique de cartes PVC avec puces NFC et QR codes officiels, vous devez d&apos;abord créer et soumettre votre gabarit dans le Studio Design.
          </p>
          <Link
            href="/admin/cards/studio"
            className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Créer et Soumettre un Modèle de Carte →
          </Link>
        </div>
      )}

      {/* Main Form */}
      {designs.length > 0 && (
        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Volume Tier & Design Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Design Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                1. Sélectionner le Gabarit Validé
              </h3>

              <select
                value={selectedDesignId}
                onChange={(e) => setSelectedDesignId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-semibold"
              >
                {designs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.layout_preset}) — Validé pour impression
                  </option>
                ))}
              </select>

              {/* Mini Preview of selected design */}
              {selectedDesign && (
                <div
                  className="w-full aspect-[85.6/53.98] rounded-2xl p-5 flex flex-col justify-between text-white shadow-lg relative overflow-hidden"
                  style={{
                    backgroundColor: selectedDesign.front_bg_color || '#0f172a',
                    color: selectedDesign.front_text_color || '#ffffff',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-xs">
                      {selectedDesign.front_headline || selectedDesign.name}
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      GABARIT APPROUVÉ
                    </span>
                  </div>
                  <div className="flex justify-between items-end text-[10px] font-mono opacity-80">
                    <span>NFC SMART CARD</span>
                    <span>300 DPI OFFSET</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Volume Tier Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                2. Volume & Tarification Dégressive (DZD)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOLUME_TIERS.map((tier) => {
                  const isSelected = selectedQuantity === tier.quantity;
                  return (
                    <div
                      key={tier.quantity}
                      onClick={() => setSelectedQuantity(tier.quantity)}
                      className={`cursor-pointer p-4 rounded-2xl border transition relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      {tier.popular && (
                        <span className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-100">{tier.quantity} Cartes PVC</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-black text-amber-400">
                          {tier.total.toLocaleString('fr-FR')} DZD
                        </span>
                        <span className="text-[10px] text-slate-500">({tier.unitPrice} DZD / u)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Shipping Address & Payment (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                3. Adresse de Livraison (58 Wilayas)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nom du Destinataire / Gérant *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Benali Karim"
                    value={shippingData.recipient_name}
                    onChange={(e) => setShippingData({ ...shippingData, recipient_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Numéro de Téléphone (Suivi SMS Livreur) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0550 12 34 56"
                    value={shippingData.phone}
                    onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Wilaya de Livraison *
                  </label>
                  <select
                    value={shippingData.wilaya}
                    onChange={(e) => setShippingData({ ...shippingData, wilaya: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {ALGERIA_WILAYAS.map((w) => (
                      <option key={w.code} value={`${w.code} - ${w.name}`}>
                        {w.code} - {w.name} ({w.arName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Commune & Adresse Complète de l&apos;Atelier *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="ex: Bab Ezzouar, Cité 5 Juillet, en face de la station Naftal"
                    value={shippingData.commune_address}
                    onChange={(e) => setShippingData({ ...shippingData, commune_address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              {/* Order Pricing Breakdown */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Cartes PVC ({selectedQuantity} unités) :</span>
                  <span className="font-mono text-slate-200">{totalPrice.toLocaleString('fr-FR')} DZD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Livraison Express 58 Wilayas :</span>
                  <span className="text-emerald-400 font-bold">Gratuite</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-100 pt-2 border-t border-slate-800">
                  <span>Total à Régler :</span>
                  <span className="text-amber-400 font-mono">{totalPrice.toLocaleString('fr-FR')} DZD</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={ordering}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {ordering ? 'Initialisation BaridiMob...' : 'Payer avec BaridiMob / EDAHABIA'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Past Orders History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 mb-4">Historique des Commandes de Cartes ({orders.length})</h3>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-500">Aucune commande de cartes passée pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Commande</th>
                  <th className="py-3 px-4">Modèle</th>
                  <th className="py-3 px-4">Quantité</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Suivi Colis</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      #{ord.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{ord.design_name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{ord.quantity} cartes</td>
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      {parseFloat(ord.total_price).toLocaleString('fr-FR')} DZD
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : ord.status === 'shipped'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                            : ord.status === 'in_production'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : ord.status === 'paid'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {ord.status === 'delivered'
                          ? 'Livré (Stock Généré)'
                          : ord.status === 'shipped'
                          ? 'En Cours de Livraison'
                          : ord.status === 'in_production'
                          ? 'En Impression'
                          : ord.status === 'paid'
                          ? 'Payé'
                          : 'En Attente Paiement'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {ord.tracking_number ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-400">{ord.carrier_name || 'Yalidine'}:</span>
                          <span>{ord.tracking_number}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(ord.created_at).toLocaleDateString('fr-FR')}
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
