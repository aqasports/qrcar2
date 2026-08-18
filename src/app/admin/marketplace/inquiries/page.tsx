'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MarketplaceInquiriesPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/marketplace/inquiries?type=${tab}`);
      if (!res.ok) throw new Error('Impossible de charger les demandes.');
      const data = await res.json();
      setInquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [tab]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/marketplace/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Erreur de mise à jour.');
      await fetchInquiries();
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Demandes & Offres Marketplace</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez les échanges de pièces et propositions de prix entre professionnels de l&apos;automobile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/marketplace"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
          >
            ← Catalogue Général
          </Link>
          <Link
            href="/admin/marketplace/my-listings"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Mes Annonces
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'received' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Demandes Reçues (Mes Pièces en Vente)
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'sent' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Demandes Envoyées (Mes Achats)
        </button>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-sm font-semibold">Aucun échange pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{inq.listing_title}</span>
                  {inq.oem_number && (
                    <span className="font-mono text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-blue-400">
                      OEM: {inq.oem_number}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  {tab === 'received' ? (
                    <span>
                      Acheteur : <strong>{inq.buyer_garage_name}</strong> • Tél :{' '}
                      <span className="font-mono text-slate-200">{inq.buyer_phone || 'Non renseigné'}</span>
                    </span>
                  ) : (
                    <span>
                      Vendeur : <strong>{inq.seller_garage_name}</strong> ({inq.location_wilaya})
                    </span>
                  )}
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-200 italic">
                  &ldquo;{inq.message}&rdquo;
                </div>

                {inq.proposed_price && (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Offre de prix proposée :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {parseFloat(inq.proposed_price).toLocaleString('fr-FR')} DZD
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (Prix initial: {parseFloat(inq.listing_price).toLocaleString('fr-FR')} DZD)
                    </span>
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    inq.status === 'accepted'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : inq.status === 'declined'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : inq.status === 'replied'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {inq.status === 'accepted'
                    ? 'Offre Acceptée'
                    : inq.status === 'declined'
                    ? 'Offre Déclinée'
                    : inq.status === 'replied'
                    ? 'Répondu'
                    : 'En Attente'}
                </span>

                {tab === 'received' && inq.status === 'unread' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(inq.id, 'accepted')}
                      disabled={actionLoadingId === inq.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(inq.id, 'declined')}
                      disabled={actionLoadingId === inq.id}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Décliner
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
