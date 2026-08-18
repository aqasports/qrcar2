'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MechanicalSolutionDetailPage() {
  const { id } = useParams() as { id: string };

  const [solution, setSolution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  const fetchSolution = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/knowledgebase/solutions/${id}`);
      if (!res.ok) throw new Error('Solution introuvable.');
      const data = await res.json();
      setSolution(data);
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolution();
  }, [id]);

  const handleVote = async () => {
    try {
      setVoting(true);
      const res = await fetch(`/api/knowledgebase/solutions/${id}/vote`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erreur lors du vote.');
      const data = await res.json();
      setSolution((prev: any) => ({
        ...prev,
        upvotes_count: data.upvotes_count,
        has_user_voted: data.has_voted,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !solution) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 max-w-2xl mx-auto space-y-4">
        <p className="text-base font-bold text-slate-200">Cette procédure de diagnostic n&apos;existe pas ou a été archivée.</p>
        <Link
          href="/admin/knowledgebase"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          ← Retour à la Base de Connaissances
        </Link>
      </div>
    );
  }

  const dtcList = Array.isArray(solution.dtc_codes)
    ? solution.dtc_codes
    : typeof solution.dtc_codes === 'string'
    ? JSON.parse(solution.dtc_codes || '[]')
    : [];

  return (
    <div className="space-y-8 font-sans max-w-5xl">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/knowledgebase"
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition flex items-center gap-1.5"
        >
          ← Retour au Répertoire des Pannes
        </Link>

        {/* Upvote & Meta */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono">
            {solution.views_count} consultations
          </span>

          <button
            onClick={handleVote}
            disabled={voting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition border ${
              solution.has_user_voted
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            <span>{solution.has_user_voted ? 'Solution Utile (Voté)' : 'Utile'}</span>
            <span className="bg-slate-950/60 px-2 py-0.5 rounded-md font-mono text-[11px]">
              {solution.upvotes_count}
            </span>
          </button>
        </div>
      </div>

      {/* Main Solution Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {dtcList.map((code: string) => (
            <span
              key={code}
              className="px-3 py-1 rounded-xl text-xs font-mono font-black bg-blue-500/10 text-blue-400 border border-blue-500/20"
            >
              CODE {code}
            </span>
          ))}

          <span className="text-xs font-bold text-slate-300 ml-auto bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl">
            {solution.make} {solution.model} {solution.engine_code && `• ${solution.engine_code}`}{' '}
            {solution.years && `• ${solution.years}`}
          </span>
        </div>

        <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-snug">
          {solution.title}
        </h1>

        {solution.diagnostic_tool && (
          <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
            <span className="text-slate-500 font-semibold">Outil de Diag :</span>
            <span className="text-slate-300 font-mono bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-lg">
              {solution.diagnostic_tool}
            </span>
          </div>
        )}
      </div>

      {/* Structured Technical Guide (5 Sections) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Step-by-Step Procedure & Diagnosis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Symptoms */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-black">
                1
              </span>
              Symptômes Constatés à l&apos;Atelier
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed pl-7">{solution.symptoms}</p>
          </div>

          {/* Section 2: Root Cause */}
          <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-3 bg-gradient-to-b from-amber-500/5 to-transparent">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black">
                2
              </span>
              Cause Racine Technique (Root Cause)
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed pl-7 font-medium">
              {solution.root_cause}
            </p>
          </div>

          {/* Section 3: Fix Steps */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                3
              </span>
              Procédure de Réparation & Recalibrage
            </h2>
            <div className="pl-7 pt-1">
              <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                {solution.step_by_step_fix}
              </pre>
            </div>
          </div>

          {/* Section 4: Parts */}
          {solution.parts_replaced && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
              <h2 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-[10px] font-black">
                  4
                </span>
                Pièces & Composants Remplacés
              </h2>
              <p className="text-xs text-slate-300 font-mono pl-7">{solution.parts_replaced}</p>
            </div>
          )}
        </div>

        {/* Right 1 Col: Author Garage Profile & Inter-Garage Contact */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Atelier Auteur de la Solution
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-blue-600/30">
                {solution.author_garage_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm leading-tight">
                  {solution.author_garage_name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400">{solution.author_city || 'Algérie'}</span>
                  {solution.is_verified_expert && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 rounded">
                      Expert Validé
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Auteur :</span>
                <span className="font-semibold">{solution.author_user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date :</span>
                <span>{new Date(solution.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              {solution.author_phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tél. Atelier :</span>
                  <span className="font-mono text-blue-400 font-bold">{solution.author_phone}</span>
                </div>
              )}
            </div>

            <Link
              href="/admin/marketplace"
              className="w-full block py-2.5 text-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Rechercher des pièces pour ce modèle →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
