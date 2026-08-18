'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const POPULAR_DTC = [
  'P0300', 'P0420', 'P0299', 'P0101', 'P0401', 'P0171', 'DF053', 'DF025', 'U0100', 'P2002'
];

export default function KnowledgebaseBrowsePage() {
  const [solutions, setSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dtcFilter, setDtcFilter] = useState('');
  const [search, setSearch] = useState('');
  const [make, setMake] = useState('all');
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchSolutions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dtcFilter) params.set('dtc', dtcFilter);
      if (search) params.set('search', search);
      if (make !== 'all') params.set('make', make);

      const res = await fetch(`/api/knowledgebase/solutions?${params.toString()}`);
      if (!res.ok) throw new Error('Impossible de charger les solutions.');
      const data = await res.json();
      setSolutions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, [dtcFilter, make]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSolutions();
  };

  const handleVote = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setVotingId(id);
      const res = await fetch(`/api/knowledgebase/solutions/${id}/vote`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Erreur de vote.');
      const data = await res.json();

      setSolutions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, upvotes_count: data.upvotes_count, has_user_voted: data.has_voted }
            : s
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Base de Connaissances & Pannes DTC</h1>
          <p className="text-sm text-slate-400 mt-1">
            Recherchez les codes défauts OBD (P0300, DF053...), causes racines et procédures de réparation validées par les maîtres-garagistes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/knowledgebase/new"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Partager une Solution Technique</span>
          </Link>
        </div>
      </div>

      {/* DTC Quick Pills Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
            Codes DTC Fréquents :
          </span>
          {POPULAR_DTC.map((code) => {
            const isSelected = dtcFilter === code;
            return (
              <button
                key={code}
                onClick={() => setDtcFilter(isSelected ? '' : code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-8 relative">
            <input
              type="text"
              placeholder="Recherche par Code Défaut (ex: P0420), Symptôme (ex: fumée noire, à-coups), Moteur (ex: 1.5 dCi, 2.0 TDI)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="md:col-span-2">
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Toutes les Marques</option>
              <option value="Renault">Renault / Dacia</option>
              <option value="Volkswagen">Volkswagen / Audi / Seat</option>
              <option value="Peugeot">Peugeot / Citroën</option>
              <option value="BMW">BMW</option>
              <option value="Mercedes-Benz">Mercedes-Benz</option>
              <option value="Toyota">Toyota</option>
              <option value="Hyundai">Hyundai / Kia</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition"
            >
              Rechercher
            </button>
          </div>
        </form>
      </div>

      {/* Solutions Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : solutions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm font-semibold">Aucune solution technique répertoriée pour ces critères.</p>
          <p className="text-xs text-slate-500 mt-1">Vous avez résolu ce cas ? Soyez le premier à partager votre diagnostic !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((sol) => {
            const dtcList = Array.isArray(sol.dtc_codes)
              ? sol.dtc_codes
              : typeof sol.dtc_codes === 'string'
              ? JSON.parse(sol.dtc_codes || '[]')
              : [];

            return (
              <Link
                key={sol.id}
                href={`/admin/knowledgebase/${sol.id}`}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition group"
              >
                <div>
                  {/* DTC Badges & Vehicle */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    {dtcList.map((code: string) => (
                      <span
                        key={code}
                        className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      >
                        {code}
                      </span>
                    ))}
                    <span className="text-[11px] font-bold text-slate-300 ml-auto">
                      {sol.make} {sol.model} {sol.engine_code && `(${sol.engine_code})`}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-100 text-base leading-snug group-hover:text-blue-400 transition line-clamp-2">
                    {sol.title}
                  </h3>

                  {/* Symptoms snippet */}
                  <p className="text-xs text-slate-400 mt-2.5 line-clamp-2">
                    <strong className="text-slate-300">Symptômes :</strong> {sol.symptoms}
                  </p>

                  {/* Root Cause snippet */}
                  <div className="mt-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-xs text-slate-300">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                      Cause Racine Identifiée :
                    </span>
                    <p className="line-clamp-2">{sol.root_cause}</p>
                  </div>
                </div>

                {/* Footer: Author & Upvotes */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 uppercase">
                      {sol.author_garage_name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                        <span>{sol.author_garage_name}</span>
                        {sol.is_verified_expert && (
                          <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1 rounded border border-emerald-500/30">
                            EXPERT
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 block">{sol.author_city || 'Algérie'}</span>
                    </div>
                  </div>

                  {/* Interactive Upvote Button */}
                  <button
                    onClick={(e) => handleVote(e, sol.id)}
                    disabled={votingId === sol.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      sol.has_user_voted
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    <span>{sol.upvotes_count}</span>
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
