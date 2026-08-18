'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface CardDesign {
  id?: string;
  name: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  layout_preset: string;
  front_logo_url: string | null;
  front_headline: string;
  front_subheadline: string;
  front_bg_color: string;
  front_accent_color: string;
  front_text_color: string;
  back_bg_color: string;
  back_text_color: string;
  back_contact_phone: string;
  back_address: string;
  back_emergency_text: string;
  is_white_label: boolean;
  rejection_reason?: string | null;
}

const PRESETS = [
  {
    id: 'modern_slate',
    name: 'Modern Slate',
    front_bg: '#0f172a',
    front_accent: '#3b82f6',
    front_text: '#ffffff',
    back_bg: '#0f172a',
    back_text: '#94a3b8',
  },
  {
    id: 'carbon_fiber',
    name: 'Carbon High-Tech',
    front_bg: '#18181b',
    front_accent: '#ef4444',
    front_text: '#f4f4f5',
    back_bg: '#18181b',
    back_text: '#a1a1aa',
  },
  {
    id: 'gold_luxury',
    name: 'Executive Gold',
    front_bg: '#1c1917',
    front_accent: '#eab308',
    front_text: '#fef08a',
    back_bg: '#1c1917',
    back_text: '#d6d3d1',
  },
  {
    id: 'classic_automotive',
    name: 'Classic Workshop',
    front_bg: '#022c22',
    front_accent: '#10b981',
    front_text: '#ecfdf5',
    back_bg: '#022c22',
    back_text: '#a7f3d0',
  },
  {
    id: 'clean_minimal',
    name: 'Clean Monochrome',
    front_bg: '#1e293b',
    front_accent: '#64748b',
    front_text: '#f8fafc',
    back_bg: '#1e293b',
    back_text: '#94a3b8',
  },
];

export default function CardStudioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [designs, setDesigns] = useState<CardDesign[]>([]);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [showSafeMargin, setShowSafeMargin] = useState(true);
  const [studioTier, setStudioTier] = useState<'template' | 'full' | 'full_whitelabel'>('full');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [currentDesign, setCurrentDesign] = useState<CardDesign>({
    name: 'Modèle Principal Atelier',
    status: 'draft',
    layout_preset: 'modern_slate',
    front_logo_url: '',
    front_headline: 'GARAGE AUTO PRECISION',
    front_subheadline: 'Passeport d’Entretien & Diagnostic Véhicule',
    front_bg_color: '#0f172a',
    front_accent_color: '#3b82f6',
    front_text_color: '#ffffff',
    back_bg_color: '#0f172a',
    back_text_color: '#94a3b8',
    back_contact_phone: '0550 12 34 56',
    back_address: 'Route Nationale 5, Bab Ezzouar, Alger',
    back_emergency_text: 'Assistance & Dépannage Atelier 24/7',
    is_white_label: false,
  });

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // 1. Fetch organization plan details to get studioTier
      const planRes = await fetch('/api/billing');
      if (planRes.ok) {
        const planData = await planRes.json();
        setStudioTier(planData?.details?.plan?.cardStudioTier || 'full');
      }

      // 2. Fetch existing designs
      const res = await fetch('/api/cards/designs');
      if (res.ok) {
        const list = await res.json();
        setDesigns(list);
        if (list.length > 0) {
          setCurrentDesign(list[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setCurrentDesign((prev) => ({
      ...prev,
      layout_preset: preset.id,
      front_bg_color: preset.front_bg,
      front_accent_color: preset.front_accent,
      front_text_color: preset.front_text,
      back_bg_color: preset.back_bg,
      back_text_color: preset.back_text,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const url = currentDesign.id ? `/api/cards/designs/${currentDesign.id}` : '/api/cards/designs';
      const method = currentDesign.id ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDesign),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de sauvegarde.');

      setCurrentDesign(data);
      setSuccess('Modèle de carte enregistré avec succès en mode brouillon.');
      fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!currentDesign.id) {
      setError('Veuillez enregistrer votre modèle avant de le soumettre.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const res = await fetch(`/api/cards/designs/${currentDesign.id}/submit`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la soumission.');

      setCurrentDesign(data.design);
      setSuccess(data.message || 'Modèle soumis pour validation.');
      fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission.');
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

  const isReadOnly = currentDesign.status === 'submitted' || currentDesign.status === 'approved';
  const isCustomDisabled = studioTier === 'template';

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Studio Design Cartes PVC (CR-80)</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              currentDesign.status === 'approved'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : currentDesign.status === 'submitted'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : currentDesign.status === 'rejected'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {currentDesign.status === 'submitted'
                ? 'En cours de validation'
                : currentDesign.status === 'approved'
                ? 'Validé pour impression'
                : currentDesign.status === 'rejected'
                ? 'Refusé'
                : 'Brouillon'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Personnalisez le format physique 85.6mm × 53.98mm (300 DPI) pour vos cartes d&apos;identité véhicule connectées.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/cards"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            ← Retour aux Cartes
          </Link>

          {!isReadOnly && (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer Brouillon'}
              </button>

              <button
                onClick={handleSubmitForReview}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Soumission...' : 'Soumettre pour Impression'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {currentDesign.status === 'rejected' && currentDesign.rejection_reason && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs shadow-xl">
          <div className="flex items-center gap-2 font-bold text-red-400 text-sm mb-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Motif du Refus Technique :
          </div>
          <p className="pl-7">{currentDesign.rejection_reason}</p>
          <p className="pl-7 mt-2 text-slate-400">Veuillez corriger le modèle et soumettre à nouveau pour validation.</p>
        </div>
      )}

      {/* Plan Gating Warning for Starter */}
      {isCustomDisabled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Votre forfait <strong>Starter</strong> permet de choisir parmi nos styles préréglés officiels. Pour importer votre logo et définir vos couleurs personnalisées, passez au forfait <strong>Pro</strong>.
            </span>
          </div>
          <Link
            href="/admin/billing"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs shrink-0 hover:bg-amber-400 transition"
          >
            Débloquer Pro
          </Link>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive CR-80 Canvas (5 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSide('front')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeSide === 'front' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Recto (Face Principale)
              </button>
              <button
                onClick={() => setActiveSide('back')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeSide === 'back' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Verso (QR & Contact)
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSafeMargin}
                onChange={(e) => setShowSafeMargin(e.target.checked)}
                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
              />
              <span>Marge de coupe 3mm</span>
            </label>
          </div>

          {/* CR-80 Physical Card Canvas (85.6mm x 53.98mm ratio = ~1.586) */}
          <div className="relative w-full aspect-[85.6/53.98] rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-800 transition-all">
            {/* Safe Margin 3mm Dotted Guide */}
            {showSafeMargin && (
              <div className="absolute inset-3.5 border border-dashed border-cyan-400/40 rounded-2xl pointer-events-none z-30 flex items-start justify-end p-2">
                <span className="text-[8px] font-mono text-cyan-400/60 uppercase">Zone Sûre (Safe Margin)</span>
              </div>
            )}

            {/* FRONT FACE */}
            {activeSide === 'front' && (
              <div
                className="w-full h-full p-6 flex flex-col justify-between relative overflow-hidden transition-colors"
                style={{
                  backgroundColor: currentDesign.front_bg_color,
                  color: currentDesign.front_text_color,
                }}
              >
                {/* Decorative Accent Graphic */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: currentDesign.front_accent_color }}
                ></div>

                {/* Top: Logo & Smart Chip Badge */}
                <div className="flex items-start justify-between z-10">
                  <div className="flex items-center gap-3">
                    {currentDesign.front_logo_url ? (
                      <img
                        src={currentDesign.front_logo_url}
                        alt="Logo"
                        className="w-12 h-12 object-contain rounded-xl"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-sm"
                        style={{ backgroundColor: currentDesign.front_accent_color }}
                      >
                        GP
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight leading-tight">
                        {currentDesign.front_headline || 'NOM DE VOTRE ATELIER'}
                      </h3>
                      <p className="text-[10px] opacity-75 font-medium">
                        {currentDesign.front_subheadline || 'Passeport d’Entretien Numérique'}
                      </p>
                    </div>
                  </div>

                  {/* Metallic Contactless Chip Visual */}
                  <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border border-amber-300 shadow-inner flex items-center justify-center">
                    <div className="w-6 h-5 border border-amber-700/50 rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-amber-700/40 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Bottom: NFC Icon & Vehicle Identity Badge */}
                <div className="flex items-end justify-between z-10">
                  <div>
                    <span className="text-[9px] font-mono opacity-60 uppercase tracking-widest block">
                      CARTE D’IDENTITÉ VÉHICULE
                    </span>
                    <span className="text-xs font-mono font-bold tracking-wider opacity-90">
                      TOKEN: 7F8A-99B2-E401
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">NFC Connecté</span>
                  </div>
                </div>
              </div>
            )}

            {/* BACK FACE */}
            {activeSide === 'back' && (
              <div
                className="w-full h-full p-6 flex flex-row justify-between items-center relative overflow-hidden transition-colors"
                style={{
                  backgroundColor: currentDesign.back_bg_color,
                  color: currentDesign.back_text_color,
                }}
              >
                {/* Left Side: Contact Info & Emergency Phone */}
                <div className="w-[58%] h-full flex flex-col justify-between z-10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Scannez pour accéder à l&apos;historique
                    </span>
                    <p className="text-[9px] opacity-80 leading-relaxed">
                      {currentDesign.back_address || 'Adresse de l’atelier et localisation GPS.'}
                    </p>
                  </div>

                  <div>
                    <div className="text-[9px] font-semibold opacity-75">Tél. Atelier & RDV :</div>
                    <div className="text-sm font-mono font-bold text-slate-100">
                      {currentDesign.back_contact_phone || '0550 00 00 00'}
                    </div>
                    {currentDesign.back_emergency_text && (
                      <div className="text-[8px] text-amber-400 mt-1 font-medium">
                        {currentDesign.back_emergency_text}
                      </div>
                    )}
                  </div>

                  {/* White-Label Footer or Powered by Platform */}
                  <div className="text-[8px] opacity-50 font-mono">
                    {currentDesign.is_white_label ? 'CERTIFIED SMART VEHICLE' : 'POWERED BY GARAGE PRO SAAS'}
                  </div>
                </div>

                {/* Right Side: Guaranteed Scannable QR Code Placeholder (High Contrast) */}
                <div className="w-[38%] flex flex-col items-center justify-center z-10">
                  <div className="w-28 h-28 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                    {/* High contrast vector QR placeholder */}
                    <div className="w-full h-full bg-slate-900 rounded-lg p-1.5 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                        <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center">
                          <div className="w-2 h-2 bg-white"></div>
                        </div>
                        <div className="text-[6px] text-white font-mono font-bold">QR PASS</div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono text-slate-400 mt-1.5 uppercase tracking-wider">
                    Jeton Unique Véhicule
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customizer Controls (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Presets Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              1. Styles & Préréglages Impression (300 DPI)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESETS.map((preset) => {
                const selected = currentDesign.layout_preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    disabled={isReadOnly}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      selected
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: preset.front_accent }}
                      ></span>
                      <span className="text-xs font-bold">{preset.name}</span>
                    </div>
                    {selected && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields Customization */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              2. Textes & Coordonnées Imprimées
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du Modèle *</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={currentDesign.name}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Titre Recto (En-tête)</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={currentDesign.front_headline}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, front_headline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sous-titre Recto</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={currentDesign.front_subheadline}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, front_subheadline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Téléphone Verso (RDV)</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={currentDesign.back_contact_phone}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, back_contact_phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Texte Assistance / Urgence</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={currentDesign.back_emergency_text}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, back_emergency_text: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adresse Atelier Imprimée</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={currentDesign.back_address}
                  onChange={(e) => setCurrentDesign({ ...currentDesign, back_address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Custom Colors (Pro & Enterprise) */}
            {!isCustomDisabled && (
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Couleurs Sur-Mesure</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Couleur Fond Recto</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        disabled={isReadOnly}
                        value={currentDesign.front_bg_color}
                        onChange={(e) => setCurrentDesign({ ...currentDesign, front_bg_color: e.target.value })}
                        className="w-8 h-8 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={currentDesign.front_bg_color}
                        onChange={(e) => setCurrentDesign({ ...currentDesign, front_bg_color: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Couleur Accent (Ligne/Boutons)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        disabled={isReadOnly}
                        value={currentDesign.front_accent_color}
                        onChange={(e) => setCurrentDesign({ ...currentDesign, front_accent_color: e.target.value })}
                        className="w-8 h-8 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        disabled={isReadOnly}
                        value={currentDesign.front_accent_color}
                        onChange={(e) => setCurrentDesign({ ...currentDesign, front_accent_color: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
