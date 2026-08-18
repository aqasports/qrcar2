'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MyMarketplaceListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/marketplace/listings?mine_only=true');
      if (!res.ok) throw new Error('Impossible de charger vos annonces.');
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Erreur de mise à jour.');
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/marketplace/listings/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Erreur lors de la suppression.');
      await fetchMyListings();
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Mes Annonces Pièces ({listings.length})</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gérez vos offres de pièces détachées, marquez vos ventes conclues ou modifiez vos prix.
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
            href="/admin/marketplace/new"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nouvelle Annonce</span>
          </Link>
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-4">
          <svg className="w-12 h-12 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm font-semibold">Vous n&apos;avez publié aucune annonce pour le moment.</p>
          <Link
            href="/admin/marketplace/new"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs transition"
          >
            Publier ma Première Pièce →
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Titre & Réf. OEM</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Prix</th>
                <th className="py-3 px-4">Quantité</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {listings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100 text-sm">{item.title}</div>
                    {item.oem_number && (
                      <span className="font-mono text-[11px] text-blue-400">OEM: {item.oem_number}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-medium capitalize">{item.category}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                    {parseFloat(item.price).toLocaleString('fr-FR')} DZD
                  </td>
                  <td className="py-3.5 px-4 font-mono">{item.quantity}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        item.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : item.status === 'reserved'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : item.status === 'sold'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.status === 'active'
                        ? 'En Ligne'
                        : item.status === 'reserved'
                        ? 'Réservé'
                        : item.status === 'sold'
                        ? 'Vendu'
                        : 'Archivé'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'reserved')}
                          disabled={actionLoadingId === item.id}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[11px] font-semibold"
                        >
                          Marquer Réservé
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'active')}
                          disabled={actionLoadingId === item.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-semibold"
                        >
                          Remettre en Ligne
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={actionLoadingId === item.id}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[11px] font-semibold"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
