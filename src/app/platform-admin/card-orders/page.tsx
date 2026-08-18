'use client';

import React, { useEffect, useState } from 'react';

export default function PlatformAdminCardOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'in_production' | 'shipped' | 'delivered'>('paid');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [shippingModalOrder, setShippingModalOrder] = useState<any>(null);
  const [carrierName, setCarrierName] = useState('Yalidine Express');
  const [trackingNumber, setTrackingNumber] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/platform-admin/card-orders');
      if (!res.ok) throw new Error('Impossible de charger les commandes de cartes.');
      const list = await res.json();
      setOrders(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string, tracking?: string, carrier?: string) => {
    try {
      setActionLoadingId(orderId);
      const res = await fetch(`/api/platform-admin/card-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          tracking_number: tracking,
          carrier_name: carrier,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la mise à jour.');
      }

      await fetchOrders();
      setShippingModalOrder(null);
      setTrackingNumber('');
    } catch (err: any) {
      alert(err.message || 'Erreur de mise à jour.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const pendingActionCount = orders.filter((o) => o.status === 'paid' || o.status === 'in_production').length;

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <span>Gestion des Commandes & Expéditions Cartes PVC</span>
            {pendingActionCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                {pendingActionCount} À expédier
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez la mise en production offset 300 DPI, l&apos;affectation des bordereaux Yalidine / ZR Express, et la génération automatique du stock de cartes.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          {[
            { key: 'paid', label: 'Payées / À Imprimer' },
            { key: 'in_production', label: 'En Impression' },
            { key: 'shipped', label: 'Expédiées' },
            { key: 'delivered', label: 'Livrées' },
            { key: 'all', label: 'Toutes' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === tab.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <p className="text-sm font-semibold">Aucune commande dans cet état.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6"
            >
              {/* Order Top Meta */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 font-bold">#{order.id.slice(0, 8)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-bold text-slate-100 text-sm">{order.org_name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Gabarit : <strong>{order.design_name}</strong> ({order.quantity} cartes PVC)
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      order.status === 'delivered'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : order.status === 'shipped'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse'
                        : order.status === 'in_production'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : order.status === 'paid'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {order.status === 'delivered'
                      ? 'Livré (Stock Créé)'
                      : order.status === 'shipped'
                      ? 'Expédié'
                      : order.status === 'in_production'
                      ? 'En Impression'
                      : order.status === 'paid'
                      ? 'Payé - À Traiter'
                      : 'Attente Paiement'}
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-400 mt-1">
                    {parseFloat(order.total_price).toLocaleString('fr-FR')} DZD
                  </span>
                </div>
              </div>

              {/* Shipping Details Box */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Wilaya de Livraison :</span>
                  <span className="font-bold text-slate-200">{order.shipping_wilaya}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Téléphone Destinataire :</span>
                  <span className="font-mono font-bold text-blue-400">{order.shipping_phone}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-slate-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Adresse Complète :</span>
                  <p className="mt-0.5">{order.shipping_address}</p>
                </div>

                {order.tracking_number && (
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Transporteur & Suivi :</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {order.carrier_name} — {order.tracking_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons Workflow */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                {order.status === 'paid' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'in_production')}
                    disabled={actionLoadingId === order.id}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
                  >
                    {actionLoadingId === order.id ? 'Mise à jour...' : '1. Lancer l’Impression Offset'}
                  </button>
                )}

                {order.status === 'in_production' && (
                  <button
                    onClick={() => setShippingModalOrder(order)}
                    disabled={actionLoadingId === order.id}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
                  >
                    2. Renseigner Suivi & Marquer Expédié
                  </button>
                )}

                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    disabled={actionLoadingId === order.id}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    {actionLoadingId === order.id ? 'Génération du stock...' : '3. Confirmer Livraison (Génère Stock)'}
                  </button>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{order.quantity} Cartes PVC intégrées à l’inventaire du garage</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shipping Modal */}
      {shippingModalOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Expédition de la Commande</h3>
            <p className="text-xs text-slate-400">
              Renseignez le transporteur et le numéro de suivi pour {shippingModalOrder.org_name} ({shippingModalOrder.quantity} cartes).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transporteur</label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100"
                >
                  <option value="Yalidine Express">Yalidine Express</option>
                  <option value="ZR Express">ZR Express</option>
                  <option value="Maystro Delivery">Maystro Delivery</option>
                  <option value="Kazi Tour">Kazi Tour</option>
                  <option value="Livraison Propre Atelier">Livraison Propre Atelier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Numéro de Suivi / Bordereau *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: YAL-778921-DZ"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShippingModalOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>

              <button
                onClick={() => handleUpdateStatus(shippingModalOrder.id, 'shipped', trackingNumber, carrierName)}
                disabled={!trackingNumber.trim() || actionLoadingId === shippingModalOrder.id}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirmer l&apos;Expédition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
