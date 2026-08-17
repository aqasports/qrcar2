'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

interface FlippablePvcCardProps {
  token: string;
  serialLabel: string;
  status?: 'unassigned' | 'active' | 'revoked' | 'lost' | string;
  vehiclePlate?: string;
  vehicleMakeModel?: string;
  size?: 'sm' | 'md' | 'lg';
  showControls?: boolean;
  className?: string;
}

export default function FlippablePvcCard({
  token,
  serialLabel,
  status = 'active',
  vehiclePlate,
  vehicleMakeModel,
  size = 'md',
  showControls = true,
  className = '',
}: FlippablePvcCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (token) {
      const publicUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/v/${token}`
        : `/v/${token}`;

      QRCode.toDataURL(publicUrl, {
        margin: 1,
        width: 360,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Failed to render QR Code:', err));
    }
  }, [token]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && token) {
      const fullUrl = `${window.location.origin}/v/${token}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Dimensions based on standard CR80 credit card aspect ratio (85.6mm x 53.98mm = 1.5858)
  const sizeStyles = {
    sm: 'w-[260px] h-[164px]',
    md: 'w-[340px] h-[214px]',
    lg: 'w-full max-w-[440px] h-[278px]',
  }[size];

  const qrDimensions = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  }[size];

  const statusConfig: Record<string, { label: string; badgeClass: string }> = {
    active: {
      label: 'Actif & Lié',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    unassigned: {
      label: 'Non Assigné',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    revoked: {
      label: 'Révoqué',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
    lost: {
      label: 'Perdu / Déclaré',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
  };

  const currentStatus = statusConfig[status] || {
    label: status,
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Perspective Card Container */}
      <div
        className={`relative cursor-pointer group ${sizeStyles}`}
        style={{ perspective: '1200px' }}
        onClick={() => setIsFlipped(!isFlipped)}
        title="Cliquer sur la carte pour la retourner (Effet 3D)"
      >
        {/* Flipping Inner Wrapper */}
        <div
          className="w-full h-full relative duration-700 transition-transform rounded-2xl shadow-2xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ================= RECTO (FRONT FACE) ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-950"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Front Background Artwork */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="/card-front.png"
                alt="QR Car PVC Card Recto"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />
            </div>

            {/* Front Overlays */}
            <div className="relative z-10 w-full h-full p-4 sm:p-5 flex flex-col justify-between">
              {/* Top Row: Serial & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] sm:text-xs font-black tracking-widest text-slate-200 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-lg">
                  {serialLabel}
                </span>
                <span
                  className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border backdrop-blur-md shadow-sm ${currentStatus.badgeClass}`}
                >
                  {currentStatus.label}
                </span>
              </div>

              {/* Bottom Row: Vehicle Plate & Flip Tip */}
              <div className="flex items-end justify-between">
                <div>
                  {vehiclePlate ? (
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                        Véhicule Associé
                      </span>
                      <span className="font-mono text-xs sm:text-sm font-black text-white bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700 block mt-0.5">
                        {vehiclePlate}
                      </span>
                      {vehicleMakeModel && (
                        <span className="text-[10px] text-slate-300 font-semibold block mt-0.5 truncate max-w-[160px]">
                          {vehicleMakeModel}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-950/70 px-2 py-1 rounded border border-slate-800">
                      Prêt pour association
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-blue-600/90 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-sm group-hover:bg-blue-500 transition">
                  <span>Voir QR</span>
                  <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ================= VERSO (BACK FACE) ================= */}
          <div
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-950"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Back Background Artwork */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src="/card-back.png"
                alt="QR Car PVC Card Verso"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-slate-950/30" />
            </div>

            {/* Back Overlays */}
            <div className="relative z-10 w-full h-full p-3 sm:p-4 flex flex-col items-center justify-between">
              {/* Top Bar Serial on Back */}
              <div className="w-full flex items-center justify-between px-1">
                <span className="font-mono text-[9px] sm:text-[10px] font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700">
                  {serialLabel}
                </span>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700">
                  CR80 PVC
                </span>
              </div>

              {/* Centered QR Code Overlay (Aligned with the white window) */}
              <div className="my-auto flex flex-col items-center">
                <div className="bg-white p-1 sm:p-1.5 rounded-xl shadow-2xl border border-slate-300">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt={`QR Code ${serialLabel}`}
                      className={`${qrDimensions} object-contain`}
                    />
                  ) : (
                    <div className={`${qrDimensions} bg-slate-100 animate-pulse rounded`} />
                  )}
                </div>
              </div>

              {/* Bottom Instructions / Flip Back */}
              <div className="w-full flex items-center justify-between px-1">
                <span className="font-mono text-[8px] sm:text-[9px] text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded">
                  /v/{token ? `${token.slice(0, 8)}...` : 'token'}
                </span>
                <div className="flex items-center gap-1 bg-slate-900/90 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-700">
                  <span>Recto</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Interactive Controls Toolbar */}
      {showControls && (
        <div className="flex items-center gap-2 mt-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition active:scale-[0.98]"
          >
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>{isFlipped ? 'Afficher Recto' : 'Afficher Verso (QR)'}</span>
          </button>

          {token && (
            <>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition active:scale-[0.98]"
                title="Copier le lien public"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <span>{copied ? 'Lien Copié !' : 'Copier Lien'}</span>
              </button>

              <a
                href={`/v/${token}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 transition active:scale-[0.98]"
                title="Ouvrir le carnet numérique du véhicule"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                <span>Ouvrir Carnet</span>
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
