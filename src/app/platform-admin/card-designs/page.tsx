'use client';

import React, { useEffect, useState } from 'react';

export default function PlatformAdminCardDesignsPage() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'approved' | 'rejected'>('submitted');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingDesign, setRejectingDesign] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cardFlipState, setCardFlipState] = useState<Record<string, 'front' | 'back'>>({});

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/platform-admin/card-designs');
      if (!res.ok) throw new Error('Impossible de charger les modèles de cartes.');
      const list = await res.json();
      setDesigns(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const handleReview = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/platform-admin/card-designs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejection_reason: reason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la validation.');
      }

      await fetchDesigns();
      setRejectingDesign(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const toggleFlip = (id: string) => {
    setCardFlipState((prev) => ({
      ...prev,
      [id]: prev[id] === 'back' ? 'front' : 'back',
    }));
  };

  const filtered = designs.filter((d) => {
    if (filter === 'all') return true;
    return d.status === filter;
  });

  const pendingCount = designs.filter((d) => d.status === 'submitted').length;

  if (loading && designs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-3">
            <span>Validation Studio Cartes PVC (300 DPI)</span>
            {pendingCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                {pendingCount} En attente
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Vérifiez la conformité des gabarits physiques CR-80 (marges de coupe 3mm, contrastes QR code, lisibilité).
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          {[
            { key: 'submitted', label: `À Valider (${pendingCount})` },
            { key: 'all', label: 'Tous' },
            { key: 'approved', label: 'Validés' },
            { key: 'rejected', label: 'Refusés' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === tab.key
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Queue Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold">Aucun modèle dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filtered.map((design) => {
            const side = cardFlipState[design.id] || 'front';
            return (
              <div
                key={design.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-6"
              >
                {/* Meta Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Garage : {design.org_name}
                    </span>
                    <h3 className="font-bold text-slate-100 text-base">{design.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-500">/{design.org_slug}</span>
                      <span>•</span>
                      <span className="text-[10px] text-amber-400 font-bold uppercase">{design.plan_name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        design.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : design.status === 'submitted'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          : design.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {design.status}
                    </span>
                    <button
                      onClick={() => toggleFlip(design.id)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-bold underline mt-1"
                    >
                      Voir {side === 'front' ? 'Verso (QR)' : 'Recto (Face)'}
                    </button>
                  </div>
                </div>

                {/* CR-80 High-Precision Canvas Preview (Aspect Ratio 85.6 / 53.98) */}
                <div className="relative w-full aspect-[85.6/53.98] rounded-2xl shadow-xl overflow-hidden border border-slate-800">
                  {/* Safe margin 3mm visual line */}
                  <div className="absolute inset-3 border border-dashed border-cyan-400/30 rounded-xl pointer-events-none z-20 flex items-start justify-end p-1.5">
                    <span className="text-[7px] font-mono text-cyan-400/50 uppercase">Safe Margin 3mm</span>
                  </div>

                  {side === 'front' ? (
                    <div
                      className="w-full h-full p-5 flex flex-col justify-between relative overflow-hidden"
                      style={{
                        backgroundColor: design.front_bg_color || '#0f172a',
                        color: design.front_text_color || '#ffffff',
                      }}
                    >
                      <div className="flex items-start justify-between z-10">
                        <div className="flex items-center gap-2.5">
                          {design.front_logo_url ? (
                            <img
                              src={design.front_logo_url}
                              alt="Logo"
                              className="w-10 h-10 object-contain rounded-lg"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow"
                              style={{ backgroundColor: design.front_accent_color || '#3b82f6' }}
                            >
                              GP
                            </div>
                          )}
                          <div>
                            <h4 className="font-extrabold text-xs tracking-tight">
                              {design.front_headline || design.org_name}
                            </h4>
                            <p className="text-[9px] opacity-75">{design.front_subheadline || 'Passeport Véhicule'}</p>
                          </div>
                        </div>

                        <div className="w-9 h-7 rounded bg-gradient-to-tr from-amber-600 to-amber-300 border border-amber-200 flex items-center justify-center shadow-inner">
                          <div className="w-4 h-4 border border-amber-800/40 rounded-sm"></div>
                        </div>
                      </div>

                      <div className="flex items-end justify-between z-10">
                        <div>
                          <span className="text-[8px] font-mono opacity-60 uppercase">CARTE D’IDENTITÉ VÉHICULE</span>
                          <span className="text-[10px] font-mono font-bold block">SAMPLE: DZ-8891-A01</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider">NFC READY</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-full h-full p-5 flex items-center justify-between relative overflow-hidden"
                      style={{
                        backgroundColor: design.back_bg_color || '#0f172a',
                        color: design.back_text_color || '#ffffff',
                      }}
                    >
                      <div className="w-[60%] h-full flex flex-col justify-between z-10">
                        <div>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block">
                            Historique Digital
                          </span>
                          <p className="text-[8px] opacity-80 mt-0.5">{design.back_address || 'Atelier & GPS'}</p>
                        </div>

                        <div>
                          <div className="text-[8px] opacity-75">Tél. Atelier :</div>
                          <div className="text-xs font-mono font-bold">{design.back_contact_phone || '0550 00 00 00'}</div>
                          {design.back_emergency_text && (
                            <div className="text-[7px] text-amber-400 mt-0.5">{design.back_emergency_text}</div>
                          )}
                        </div>

                        <div className="text-[7px] opacity-40 font-mono">
                          {design.is_white_label ? 'CERTIFIED SMART VEHICLE' : 'POWERED BY GARAGE PRO'}
                        </div>
                      </div>

                      <div className="w-[35%] flex flex-col items-center justify-center z-10">
                        <div className="w-20 h-20 bg-white p-1.5 rounded-xl shadow-lg flex items-center justify-center">
                          <div className="w-full h-full bg-slate-900 rounded p-1 flex flex-col justify-between">
                            <div className="flex justify-between">
                              <div className="w-3.5 h-3.5 border border-white rounded-xs"></div>
                              <div className="w-3.5 h-3.5 border border-white rounded-xs"></div>
                            </div>
                            <div className="flex justify-between items-end">
                              <div className="w-3.5 h-3.5 border border-white rounded-xs"></div>
                              <span className="text-[5px] text-white font-mono">QR</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[7px] font-mono text-slate-400 mt-1 uppercase">Scan 20x20mm</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rejection notice if present */}
                {design.status === 'rejected' && design.rejection_reason && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    <strong>Motif de refus :</strong> {design.rejection_reason}
                  </div>
                )}

                {/* Operator Actions Bar */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setRejectingDesign(design)}
                    disabled={actionLoadingId === design.id}
                    className="px-4 py-2 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 hover:bg-red-600/20 text-xs font-bold transition disabled:opacity-50"
                  >
                    Refuser avec Motif
                  </button>

                  <button
                    onClick={() => handleReview(design.id, 'approve')}
                    disabled={actionLoadingId === design.id}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    {actionLoadingId === design.id ? 'Validation...' : '✓ Valider le Gabarit Impression'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingDesign && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Refuser le Gabarit de Carte</h3>
            <p className="text-xs text-slate-400">
              Veuillez indiquer au garage la raison technique du refus (ex: logo flou, texte hors marge de coupe, contraste QR insuffisant).
            </p>

            <textarea
              rows={4}
              required
              placeholder="Ex: Le logo importé est pixellisé en 300 DPI, et le numéro de téléphone dépasse la marge de coupe de 3mm."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500"
            ></textarea>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingDesign(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Annuler
              </button>

              <button
                onClick={() => handleReview(rejectingDesign.id, 'reject', rejectionReason)}
                disabled={!rejectionReason.trim() || actionLoadingId === rejectingDesign.id}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Confirmer le Refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
