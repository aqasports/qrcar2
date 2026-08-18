'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import FlippablePvcCard from '@/components/FlippablePvcCard';

interface Card {
  id: string;
  token: string;
  serial_label: string;
  status: 'unassigned' | 'active' | 'revoked' | 'lost';
  vehicle_id: string | null;
  plate_number?: string;
  make?: string;
  model?: string;
  linked_at: string | null;
  revoked_at: string | null;
}

export default function CardsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchCount, setBatchCount] = useState('24');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState<'3d' | 'table'>('3d');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPreviewCard, setSelectedPreviewCard] = useState<Card | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cards');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCards(data);
        if (data.length > 0 && !selectedPreviewCard) {
          setSelectedPreviewCard(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/cards/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: parseInt(batchCount, 10) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenError(data.error || 'Erreur lors de la génération du lot');
      } else {
        setSuccessMsg(data.message);
        fetchCards();
      }
    } catch (err) {
      setGenError('Impossible de contacter le serveur.');
    } finally {
      setGenerating(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    if (!statusFilter) return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Cartes PVC QR & Stock Physique</h2>
          <p className="text-slate-400 text-sm mt-1">Génération en lot, impression A4 et visualisation 3D des cartes physiques</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/cards/studio"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Studio Design (CR-80)</span>
          </Link>

          <Link
            href="/admin/cards/order"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Commander des Cartes</span>
          </Link>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === '3d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span>Galerie 3D Flip</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            <span>Tableau Registre</span>
          </button>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Batch Generator & Printing Station */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl h-fit space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Générer un Lot de Cartes</h3>
            <p className="text-xs text-slate-400 mt-1">Créez des jetons cryptographiques 128-bit vierges prêts à imprimer.</p>
          </div>

          {genError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {genError}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleGenerateBatch} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Nombre de Cartes à Générer
              </label>
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-slate-200 outline-none text-sm font-semibold"
              >
                <option value="5">5 cartes (Échantillon)</option>
                <option value="10">10 cartes</option>
                <option value="24">24 cartes (Planche A4 standard recommandée)</option>
                <option value="50">50 cartes (Gros tirage)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl transition shadow-lg shadow-blue-500/15 active:scale-[0.98] disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>{generating ? 'Génération en cours...' : 'Générer les Cartes PVC'}</span>
            </button>
          </form>

          {/* Quick PDF Print Sheet */}
          <div className="pt-6 border-t border-slate-850 space-y-3">
            <h4 className="text-sm font-bold text-slate-200">Planches d&apos;Impression A4</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Téléchargez la planche A4 haute définition prête pour impression industrielle sur cartes PVC CR80.
            </p>
            <a
              href="/api/cards/print"
              target="_blank"
              rel="noreferrer"
              className="w-full text-center bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24-1.127.42-2.329 1.558-2.684l9.04-2.825a2.25 2.25 0 012.825 1.558l1.32 4.225a2.25 2.25 0 01-1.558 2.825l-9.04 2.825a2.25 2.25 0 01-2.825-1.558l-1.32-4.225z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3.75m0 0h3.75m-3.75 0h-3.75M12 3v3.75m0 0H8.25m3.75 0h3.75" />
              </svg>
              <span>Télécharger la Planche PDF A4 &darr;</span>
            </a>
          </div>
        </div>

        {/* Card Inventory Viewer (3D Grid or Table) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status filter tabs */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === '' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Toutes ({cards.length})
              </button>
              <button
                onClick={() => setStatusFilter('unassigned')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === 'unassigned' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Disponibles ({cards.filter((c) => c.status === 'unassigned').length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  statusFilter === 'active' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Liées ({cards.filter((c) => c.status === 'active').length})
              </button>
            </div>

            <span className="text-xs font-mono text-slate-500">
              {filteredCards.length} carte(s) affichée(s)
            </span>
          </div>

          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Chargement du registre des cartes PVC...
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Aucune carte ne correspond aux critères sélectionnés.
            </div>
          ) : viewMode === '3d' ? (
            /* 3D Flippable Cards Showcase Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col items-center justify-between"
                >
                  <FlippablePvcCard
                    token={card.token}
                    serialLabel={card.serial_label}
                    status={card.status}
                    vehiclePlate={card.plate_number}
                    vehicleMakeModel={card.make && card.model ? `${card.make} ${card.model}` : undefined}
                    size="md"
                    showControls={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/40">
                      <th className="py-3.5 px-4">N° Série</th>
                      <th className="py-3.5 px-4">Jeton Cryptographique</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4">Date Association</th>
                      <th className="py-3.5 px-4 text-right">Aperçu 3D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-xs">
                    {filteredCards.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-850/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{c.serial_label}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400 truncate max-w-[140px]">{c.token}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              c.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : c.status === 'unassigned'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono">
                          {c.linked_at ? new Date(c.linked_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedPreviewCard(c)}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300"
                          >
                            Voir Carte 3D &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Preview Modal (When triggered from Table mode) */}
      {selectedPreviewCard && viewMode === 'table' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">
                Aperçu 3D : {selectedPreviewCard.serial_label}
              </h3>
              <button
                onClick={() => setSelectedPreviewCard(null)}
                className="text-slate-400 hover:text-slate-200 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <div className="flex justify-center py-2">
              <FlippablePvcCard
                token={selectedPreviewCard.token}
                serialLabel={selectedPreviewCard.serial_label}
                status={selectedPreviewCard.status}
                vehiclePlate={selectedPreviewCard.plate_number}
                size="md"
                showControls={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
