'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';

export interface VehicleDamageMarker {
  id: string;
  xPercent: number;
  yPercent: number;
  view: 'front' | 'rear' | 'left' | 'right' | 'top';
  damageType: 'scratch' | 'dent' | 'paint_chip' | 'glass_crack' | 'tire_wear';
  severity: 'minor' | 'moderate' | 'severe';
  description?: string;
}

interface VehicleIntakeMapProps {
  markers?: VehicleDamageMarker[];
  onChange?: (markers: VehicleDamageMarker[]) => void;
  disabled?: boolean;
}

export function VehicleIntakeMap({
  markers = [],
  onChange,
  disabled = false,
}: VehicleIntakeMapProps) {
  const [activeView, setActiveView] = useState<'front' | 'rear' | 'left' | 'right' | 'top'>('left');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [damageType, setDamageType] = useState<VehicleDamageMarker['damageType']>('scratch');
  const [severity, setSeverity] = useState<VehicleDamageMarker['severity']>('minor');
  const [description, setDescription] = useState('');

  const currentViewMarkers = markers.filter((m) => m.view === activeView);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newMarker: VehicleDamageMarker = {
      id: `dmg_${Date.now()}`,
      xPercent: x,
      yPercent: y,
      view: activeView,
      damageType,
      severity,
      description: description.trim() || undefined,
    };

    if (onChange) {
      onChange([...markers, newMarker]);
    }
    setDescription('');
  };

  const handleRemoveMarker = (id: string) => {
    if (disabled) return;
    if (onChange) {
      onChange(markers.filter((m) => m.id !== id));
    }
    if (selectedMarkerId === id) setSelectedMarkerId(null);
  };

  const getDamageLabel = (type: string) => {
    switch (type) {
      case 'scratch':
        return 'Rayure carrosserie';
      case 'dent':
        return 'Enfoncement / Bossage';
      case 'paint_chip':
        return 'Éclat de peinture';
      case 'glass_crack':
        return 'Impact vitrage';
      case 'tire_wear':
        return 'Usure / Dommage pneu';
      default:
        return type;
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'severe':
        return 'bg-danger text-white border-danger';
      case 'moderate':
        return 'bg-amber-500 text-white border-amber-500';
      default:
        return 'bg-blue-500 text-white border-blue-500';
    }
  };

  return (
    <Card className="border border-border-default font-sans overflow-hidden">
      <CardHeader className="pb-3 border-b border-border-subtle bg-surface-raised/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Relevé Visuel d’Entrée & État des Lieux Carrosserie
            </CardTitle>
            <p className="text-[11px] text-text-muted mt-0.5">
              Cliquez sur la silhouette du véhicule pour cartographier les défauts pré-existants avant travaux.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-surface-base border border-border-subtle text-text-secondary">
              {markers.length} défaut(s) relevé(s)
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* View Perspective Selector */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-1">
            {[
              { id: 'left', label: 'Côté Gauche' },
              { id: 'right', label: 'Côté Droit' },
              { id: 'front', label: 'Face Avant' },
              { id: 'rear', label: 'Face Arrière' },
              { id: 'top', label: 'Vue du Dessus' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveView(v.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === v.id
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {!disabled && (
            <div className="flex items-center gap-2">
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value as any)}
                className="px-2.5 py-1 bg-surface-base border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="scratch">Rayure</option>
                <option value="dent">Enfoncement</option>
                <option value="paint_chip">Éclat peinture</option>
                <option value="glass_crack">Impact vitrage</option>
                <option value="tire_wear">Pneu endommagé</option>
              </select>

              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="px-2.5 py-1 bg-surface-base border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="minor">Légère</option>
                <option value="moderate">Moyenne</option>
                <option value="severe">Critique</option>
              </select>
            </div>
          )}
        </div>

        {/* 2D Silhouette Canvas */}
        <div className="relative w-full aspect-[21/9] bg-[#050811] rounded-2xl border border-border-default overflow-hidden flex items-center justify-center p-4 select-none">
          {/* SVG Vehicle Silhouette Blueprint */}
          <svg
            viewBox="0 0 800 300"
            className="w-full h-full cursor-crosshair"
            onClick={handleSvgClick}
          >
            {/* Grid Lines */}
            <defs>
              <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="800" height="300" fill="url(#blueprint-grid)" />

            {/* Vehicle Profile Body Silhouette */}
            {activeView === 'left' && (
              <g stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2.5" fill="rgba(15, 23, 42, 0.6)">
                {/* Wheels */}
                <circle cx="200" cy="230" r="45" stroke="#3b82f6" strokeWidth="4" fill="#0f172a" />
                <circle cx="200" cy="230" r="25" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="#1e293b" />
                <circle cx="620" cy="230" r="45" stroke="#3b82f6" strokeWidth="4" fill="#0f172a" />
                <circle cx="620" cy="230" r="25" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="#1e293b" />
                {/* Body Outline */}
                <path d="M 80 220 L 140 220 A 55 55 0 0 1 255 220 L 565 220 A 55 55 0 0 1 675 220 L 730 220 L 730 180 L 680 150 L 520 100 L 300 100 L 190 150 L 80 160 Z" />
                {/* Windows & Doors */}
                <path d="M 310 110 L 410 110 L 410 160 L 220 160 Z" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" />
                <path d="M 420 110 L 510 110 L 650 155 L 420 160 Z" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" />
                <line x1="415" y1="110" x2="415" y2="215" stroke="rgba(255,255,255,0.15)" />
              </g>
            )}

            {activeView === 'right' && (
              <g stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2.5" fill="rgba(15, 23, 42, 0.6)">
                <circle cx="180" cy="230" r="45" stroke="#3b82f6" strokeWidth="4" fill="#0f172a" />
                <circle cx="180" cy="230" r="25" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="#1e293b" />
                <circle cx="600" cy="230" r="45" stroke="#3b82f6" strokeWidth="4" fill="#0f172a" />
                <circle cx="600" cy="230" r="25" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="#1e293b" />
                <path d="M 720 220 L 655 220 A 55 55 0 0 1 545 220 L 235 220 A 55 55 0 0 1 125 220 L 70 220 L 70 180 L 120 150 L 280 100 L 500 100 L 610 150 L 720 160 Z" />
                <path d="M 490 110 L 390 110 L 390 160 L 580 160 Z" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" />
                <path d="M 380 110 L 290 110 L 150 155 L 380 160 Z" fill="rgba(59, 130, 246, 0.15)" stroke="rgba(59, 130, 246, 0.5)" />
              </g>
            )}

            {(activeView === 'front' || activeView === 'rear' || activeView === 'top') && (
              <g stroke="rgba(59, 130, 246, 0.4)" strokeWidth="2.5" fill="rgba(15, 23, 42, 0.6)">
                <rect x="250" y="80" width="300" height="150" rx="30" />
                <path d="M 280 120 L 520 120 L 500 180 L 300 180 Z" fill="rgba(59, 130, 246, 0.15)" />
                <circle cx="280" cy="200" r="16" fill="#3b82f6" />
                <circle cx="520" cy="200" r="16" fill="#3b82f6" />
              </g>
            )}

            {/* Render Damage Markers for this View */}
            {currentViewMarkers.map((m) => {
              const xPos = (m.xPercent / 100) * 800;
              const yPos = (m.yPercent / 100) * 300;
              return (
                <g
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMarkerId(m.id);
                  }}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={xPos}
                    cy={yPos}
                    r="12"
                    className={`${
                      m.severity === 'severe' ? 'fill-red-500' : m.severity === 'moderate' ? 'fill-amber-500' : 'fill-blue-500'
                    } stroke-white stroke-2 shadow-lg animate-pulse`}
                  />
                  <text
                    x={xPos}
                    y={yPos + 4}
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold fill-white pointer-events-none"
                  >
                    !
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Relevé List Table */}
        {markers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
              Détail des Anomalies Enregistrées
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {markers.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getSeverityColor(m.severity)}`}>
                        {m.severity === 'severe' ? 'Critique' : m.severity === 'moderate' ? 'Moyen' : 'Léger'}
                      </span>
                      <span className="text-xs font-bold text-text-primary truncate">
                        {getDamageLabel(m.damageType)}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-muted block font-mono">
                      Vue: {m.view.toUpperCase()} • Pos: {m.xPercent}%, {m.yPercent}%
                    </span>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMarker(m.id)}
                      className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10"
                      title="Supprimer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
