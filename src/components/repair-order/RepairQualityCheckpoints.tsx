'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui';

export type CheckpointStatus = 'conforme' | 'warning' | 'defect' | 'unchecked';

export interface QualityCheckpointItem {
  id: string;
  name: string;
  category: 'brakes' | 'suspension' | 'fluids' | 'electrical' | 'tires' | 'general';
  status: CheckpointStatus;
  note?: string;
}

export const DEFAULT_WORKSHOP_CHECKPOINTS: QualityCheckpointItem[] = [
  // Freinage
  { id: 'chk_brake_pads', name: 'Épaisseur plaquettes avant & arrière', category: 'brakes', status: 'unchecked' },
  { id: 'chk_brake_discs', name: 'État d’usure et voile des disques', category: 'brakes', status: 'unchecked' },
  { id: 'chk_brake_fluid', name: 'Teneur en humidité liquide de frein (DOT4)', category: 'brakes', status: 'unchecked' },
  // Liaison au sol & Direction
  { id: 'chk_susp_shocks', name: 'Absence de fuite sur amortisseurs', category: 'suspension', status: 'unchecked' },
  { id: 'chk_susp_joints', name: 'Jeu rotules de direction & triangles', category: 'suspension', status: 'unchecked' },
  { id: 'chk_susp_bushings', name: 'État des silentblocs de barre stabilisatrice', category: 'suspension', status: 'unchecked' },
  // Moteur & Fluides
  { id: 'chk_fluid_oil', name: 'Niveau et viscosité huile moteur', category: 'fluids', status: 'unchecked' },
  { id: 'chk_fluid_coolant', name: 'Protection gel et niveau liquide de refroidissement', category: 'fluids', status: 'unchecked' },
  { id: 'chk_belts_visual', name: 'Inspection visuelle courroie d’accessoire', category: 'fluids', status: 'unchecked' },
  // Pneumatiques & Roues
  { id: 'chk_tires_pressure', name: 'Pressions 4 roues + roue de secours', category: 'tires', status: 'unchecked' },
  { id: 'chk_tires_tread', name: 'Profondeur sculpture pneumatiques (min 1.6mm)', category: 'tires', status: 'unchecked' },
  // Électronique & Visibilité
  { id: 'chk_battery_health', name: 'Tension repos et charge alternateur 12V', category: 'electrical', status: 'unchecked' },
  { id: 'chk_lights_check', name: 'Fonctionnement feux croisement/route/stop/clignotants', category: 'electrical', status: 'unchecked' },
  { id: 'chk_obd_scan', name: 'Scan calculateur OBD-II (Absence de codes défauts)', category: 'electrical', status: 'unchecked' },
];

interface RepairQualityCheckpointsProps {
  checkpoints: QualityCheckpointItem[];
  onChange: (checkpoints: QualityCheckpointItem[]) => void;
  disabled?: boolean;
}

export function RepairQualityCheckpoints({
  checkpoints = [],
  onChange,
  disabled = false,
}: RepairQualityCheckpointsProps) {
  // Ensure we have items, fallback to default if empty
  const items = checkpoints.length > 0 ? checkpoints : DEFAULT_WORKSHOP_CHECKPOINTS;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const handleStatusChange = (id: string, newStatus: CheckpointStatus) => {
    if (disabled) return;
    const updated = items.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    onChange(updated);
  };

  const handleNoteChange = (id: string, note: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, note } : item
    );
    onChange(updated);
  };

  const handleSetAllConforme = () => {
    if (disabled) return;
    const updated = items.map((item) => ({
      ...item,
      status: item.status === 'unchecked' ? ('conforme' as CheckpointStatus) : item.status,
    }));
    onChange(updated);
  };

  // Stats calculation
  const total = items.length;
  const checkedCount = items.filter((i) => i.status !== 'unchecked').length;
  const conformeCount = items.filter((i) => i.status === 'conforme').length;
  const warningCount = items.filter((i) => i.status === 'warning').length;
  const defectCount = items.filter((i) => i.status === 'defect').length;

  const categories = [
    { id: 'all', label: 'Tous les points' },
    { id: 'brakes', label: 'Freinage' },
    { id: 'suspension', label: 'Liaison & Direction' },
    { id: 'fluids', label: 'Moteur & Niveaux' },
    { id: 'tires', label: 'Pneumatiques' },
    { id: 'electrical', label: 'Électronique & Éclairage' },
  ];

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((i) => i.category === selectedCategory);

  return (
    <Card className="border border-border-default font-sans overflow-hidden">
      <CardHeader className="pb-3 border-b border-border-subtle bg-surface-raised/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-text-primary">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Contrôle Qualité & Points de Sécurité Atelier
            </CardTitle>
            <p className="text-[11px] text-text-muted mt-0.5">
              Checklist technique standardisée avant restitution du véhicule au client.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-surface-base border border-border-subtle text-text-secondary">
                {checkedCount}/{total} vérifiés
              </span>
              {conformeCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  {conformeCount} OK
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  {warningCount} Alerte
                </span>
              )}
              {defectCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-danger/10 text-danger font-bold border border-danger/25">
                  {defectCount} Défaut
                </span>
              )}
            </div>

            {!disabled && checkedCount < total && (
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={handleSetAllConforme}
              >
                Tout marquer OK
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border-subtle text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-accent text-white font-bold'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Checkpoints Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  item.status === 'conforme'
                    ? 'bg-emerald-500/5 border-emerald-500/25'
                    : item.status === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/25'
                    : item.status === 'defect'
                    ? 'bg-danger/5 border-danger/30'
                    : 'bg-surface-base border-border-subtle'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-text-primary block leading-snug">
                      {item.name}
                    </span>
                    {item.note && (
                      <p className="text-[10px] text-text-secondary bg-surface-raised/80 px-2 py-0.5 rounded border border-border-subtle italic">
                        Note: {item.note}
                      </p>
                    )}
                  </div>

                  {/* 3-State Action Buttons */}
                  {!disabled && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Conforme"
                        onClick={() =>
                          handleStatusChange(
                            item.id,
                            item.status === 'conforme' ? 'unchecked' : 'conforme'
                          )
                        }
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                          item.status === 'conforme'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-surface-raised text-text-muted hover:text-emerald-400 border border-border-subtle'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        title="À surveiller"
                        onClick={() =>
                          handleStatusChange(
                            item.id,
                            item.status === 'warning' ? 'unchecked' : 'warning'
                          )
                        }
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                          item.status === 'warning'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-surface-raised text-text-muted hover:text-amber-400 border border-border-subtle'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        title="Défaut critique"
                        onClick={() =>
                          handleStatusChange(
                            item.id,
                            item.status === 'defect' ? 'unchecked' : 'defect'
                          )
                        }
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition ${
                          item.status === 'defect'
                            ? 'bg-danger text-white shadow-sm'
                            : 'bg-surface-raised text-text-muted hover:text-danger border border-border-subtle'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {disabled && (
                    <div className="shrink-0">
                      {item.status === 'conforme' && <Badge variant="success">OK</Badge>}
                      {item.status === 'warning' && <Badge variant="warning">Alerte</Badge>}
                      {item.status === 'defect' && <Badge variant="danger">Défaut</Badge>}
                      {item.status === 'unchecked' && <Badge variant="neutral">Non fait</Badge>}
                    </div>
                  )}
                </div>

                {/* Optional Note input trigger for defects or warnings */}
                {!disabled && (item.status === 'warning' || item.status === 'defect') && (
                  <div className="mt-2 pt-2 border-t border-border-subtle/50">
                    {editingNoteId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item.note || ''}
                          onChange={(e) => handleNoteChange(item.id, e.target.value)}
                          placeholder="Détails du défaut constaté (ex: usé à 85%)..."
                          className="w-full px-2 py-1 bg-surface-raised border border-border-default rounded text-[11px] text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                          autoFocus
                          onBlur={() => setEditingNoteId(null)}
                        />
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="text-[10px] font-bold text-accent px-2 py-1 rounded bg-accent/10 hover:bg-accent/20"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingNoteId(item.id)}
                        className="text-[10px] text-text-muted hover:text-accent flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {item.note ? 'Modifier la remarque' : 'Ajouter une précision technique'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
