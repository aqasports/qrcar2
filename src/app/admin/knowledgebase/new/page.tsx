'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewMechanicalSolutionPage() {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    dtc_codes: '',
    make: 'Renault',
    model: '',
    engine_code: '',
    years: '',
    diagnostic_tool: '',
    symptoms: '',
    root_cause: '',
    step_by_step_fix: '',
    parts_replaced: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const res = await fetch('/api/knowledgebase/solutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la publication.');

      router.push(`/admin/knowledgebase/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">Publier une Solution Technique (DTC)</h1>
          <p className="text-sm text-slate-400 mt-1">
            Partagez votre expertise de diagnostic, causes racines et procédures de réparation avec la communauté des garagistes.
          </p>
        </div>

        <Link
          href="/admin/knowledgebase"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition"
        >
          ← Retour à la Base
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Titre de la Panne & Véhicule *
            </label>
            <input
              type="text"
              required
              placeholder="ex: Perte de puissance et mode dégradé avec voyant injection à contrôler sur 1.5 dCi"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Codes Défauts DTC Associés (séparés par des virgules) *
            </label>
            <input
              type="text"
              placeholder="ex: P0303, DF053, P0203"
              value={formData.dtc_codes}
              onChange={(e) => setFormData({ ...formData, dtc_codes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-blue-400 font-mono font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Marque *</label>
            <input
              type="text"
              required
              placeholder="ex: Renault, Volkswagen, Peugeot, BMW"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Modèle *</label>
            <input
              type="text"
              required
              placeholder="ex: Clio 4, Golf 7, 308, Serie 3"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Code Moteur / Cylindrée</label>
            <input
              type="text"
              placeholder="ex: 1.5 dCi K9K 608 ou 2.0 TDI CRBC"
              value={formData.engine_code}
              onChange={(e) => setFormData({ ...formData, engine_code: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Années Concernées</label>
            <input
              type="text"
              placeholder="ex: 2012 - 2019"
              value={formData.years}
              onChange={(e) => setFormData({ ...formData, years: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Outil de Diagnostic / Appareil de Mesure Utilisé
            </label>
            <input
              type="text"
              placeholder="ex: Launch X431 PAD VII + Oscilloscope PicoScope 4425A"
              value={formData.diagnostic_tool}
              onChange={(e) => setFormData({ ...formData, diagnostic_tool: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              1. Symptômes Constatés (Comportement & Voyants) *
            </label>
            <textarea
              rows={3}
              required
              placeholder="ex: Le véhicule cale à l'accélération franche au-dessus de 2500 tr/min. Voyant 'Injection à Contrôler' allumé avec bridage à 2000 tr/min."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              2. Cause Racine Identifiée (Diagnostic Approfondi) *
            </label>
            <textarea
              rows={3}
              required
              placeholder="ex: Faisceau électrique de commande de l'injecteur n°3 endommagé par frottement sur l'arête du support de boîte à air, créant une coupure intermittente lors des vibrations moteur."
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              3. Procédure de Réparation Étape par Étape *
            </label>
            <textarea
              rows={4}
              required
              placeholder="1. Déposer le boîtier de filtre à air pour accéder au faisceau injecteur.&#10;2. Contrôler la continuité et l'isolement du faisceau sous vibration.&#10;3. Réparer le fil sectionné avec manchon thermorétractable étanche et gaine de protection annelée.&#10;4. Effacer les codes défauts et effectuer un apprentissage de l'injecteur au ralenti."
              value={formData.step_by_step_fix}
              onChange={(e) => setFormData({ ...formData, step_by_step_fix: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
            ></textarea>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              4. Pièces Remplacées & Références (Optionnel)
            </label>
            <input
              type="text"
              placeholder="ex: Connecteur injecteur Delphi 2 voies + Gaine annelée fendue"
              value={formData.parts_replaced}
              onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link
            href="/admin/knowledgebase"
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
          >
            {submitting ? 'Publication...' : 'Publier la Procédure Technique'}
          </button>
        </div>
      </form>
    </div>
  );
}
