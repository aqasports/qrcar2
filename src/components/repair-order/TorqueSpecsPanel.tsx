'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from '@/components/ui';

interface TorqueSpecItem {
  id?: string;
  category: string;
  make?: string | null;
  model?: string | null;
  engine_code?: string | null;
  component: string;
  torque_nm: number;
  torque_sequence?: string | null;
  thread_spec?: string | null;
  bolt_grade?: string | null;
  notes?: string | null;
  source?: string;
}

interface TorqueSpecsPanelProps {
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  engineCode?: string | null;
  initialCollapsed?: boolean;
}

export function TorqueSpecsPanel({
  vehicleMake,
  vehicleModel,
  engineCode,
  initialCollapsed = false,
}: TorqueSpecsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [activeTab, setActiveTab] = useState<'wheels' | 'engine' | 'plugs' | 'drain' | 'brakes' | 'calculator'>('wheels');
  const [specs, setSpecs] = useState<TorqueSpecItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ISO Calculator State
  const [calcThread, setCalcThread] = useState('M12');
  const [calcGrade, setCalcGrade] = useState<'8.8' | '10.9' | '12.9'>('10.9');
  const [calcCondition, setCalcCondition] = useState<'dry' | 'lubricated'>('lubricated');
  const [calcResult, setCalcResult] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSpecs() {
      setLoading(true);
      try {
        let categoryParam = 'wheel_fastener';
        if (activeTab === 'engine') categoryParam = 'cylinder_head';
        else if (activeTab === 'plugs') categoryParam = 'spark_plug';
        else if (activeTab === 'drain') categoryParam = 'oil_drain';
        else if (activeTab === 'brakes') categoryParam = 'brake_caliper';

        if (activeTab === 'calculator') {
          setLoading(false);
          return;
        }

        const url = new URL('/api/torque-specs', window.location.origin);
        url.searchParams.set('category', categoryParam);
        if (vehicleMake) url.searchParams.set('make', vehicleMake);
        if (engineCode && activeTab === 'engine') url.searchParams.set('engine', engineCode);
        if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

        const res = await fetch(url.toString());
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.data?.specs)) {
          setSpecs(data.data.specs);
        }
      } catch (err) {
        console.error('Failed to load torque specs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSpecs();
    return () => {
      isMounted = false;
    };
  }, [activeTab, vehicleMake, engineCode, searchQuery]);

  // ISO Calculator fetch
  useEffect(() => {
    if (activeTab !== 'calculator') return;
    let isMounted = true;

    async function runCalc() {
      try {
        const url = new URL('/api/torque-specs', window.location.origin);
        url.searchParams.set('thread', calcThread);
        url.searchParams.set('grade', calcGrade);
        url.searchParams.set('condition', calcCondition);

        const res = await fetch(url.toString());
        const data = await res.json();
        if (isMounted && data.success && data.data?.calculation) {
          setCalcResult(data.data.calculation);
        }
      } catch (err) {
        console.error(err);
      }
    }

    runCalc();
    return () => {
      isMounted = false;
    };
  }, [activeTab, calcThread, calcGrade, calcCondition]);

  return (
    <Card className="p-4 space-y-3 bg-surface-raised border border-border-default font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Référentiel Technique & Couples de Serrage
          </span>
          {vehicleMake && (
            <Badge variant="info">
              {vehicleMake} {vehicleModel ? vehicleModel : ''}
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs font-semibold text-text-muted hover:text-accent flex items-center gap-1 transition-colors"
        >
          <span>{isCollapsed ? 'Afficher' : 'Masquer'}</span>
          <svg
            className={`w-3.5 h-3.5 transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'wheels', label: 'Roues & Moyeux' },
              { id: 'engine', label: 'Culasse & Moteur' },
              { id: 'plugs', label: 'Bougies' },
              { id: 'drain', label: 'Vidange' },
              { id: 'brakes', label: 'Freinage' },
              { id: 'calculator', label: 'Calculateur ISO 898' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-accent text-white shadow-sm'
                    : 'bg-surface-base text-text-secondary hover:bg-surface-hover border border-border-subtle'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Specs List */}
          {activeTab !== 'calculator' ? (
            <div className="space-y-2">
              {/* Optional Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer les spécifications (ex: K9K, Clio, M12, 110 Nm...)"
                className="w-full px-2.5 py-1.5 bg-surface-base border border-border-default rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />

              {loading ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-text-muted">
                  <Spinner size="sm" />
                  <span>Chargement des couples de serrage...</span>
                </div>
              ) : specs.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">
                  Aucun couple de serrage répertorié pour ces critères.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {specs.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl bg-surface-base border border-border-subtle hover:border-border-default space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                            {item.make || 'Universel'} {item.model ? `• ${item.model}` : ''} {item.engine_code ? `[${item.engine_code}]` : ''}
                          </span>
                          <span className="text-xs font-bold text-text-primary block leading-tight">
                            {item.component}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black font-mono text-accent block">
                            {item.torque_nm} N·m
                          </span>
                          {item.thread_spec && (
                            <span className="text-[10px] font-mono text-text-muted block">
                              {item.thread_spec}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.torque_sequence && (
                        <div className="p-1.5 rounded bg-surface-raised border border-border-subtle text-[11px] font-mono text-accent">
                          {item.torque_sequence}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-[11px] text-text-secondary leading-snug">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ISO 898-1 Fastener Calculator Tab */
            <div className="p-3 bg-surface-base rounded-xl border border-border-subtle space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">
                    Filetage Métrique
                  </label>
                  <select
                    value={calcThread}
                    onChange={(e) => setCalcThread(e.target.value)}
                    className="w-full px-2 py-1 bg-surface-raised border border-border-default rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {['M5', 'M6', 'M7', 'M8', 'M10', 'M12', 'M14', 'M16', 'M18', 'M20', 'M22', 'M24'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">
                    Classe de Résistance
                  </label>
                  <select
                    value={calcGrade}
                    onChange={(e) => setCalcGrade(e.target.value as any)}
                    className="w-full px-2 py-1 bg-surface-raised border border-border-default rounded-lg text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="8.8">Classe 8.8 (Standard)</option>
                    <option value="10.9">Classe 10.9 (Haute Résistance)</option>
                    <option value="12.9">Classe 12.9 (Très Haute)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">
                    Lubrification Filet
                  </label>
                  <select
                    value={calcCondition}
                    onChange={(e) => setCalcCondition(e.target.value as any)}
                    className="w-full px-2 py-1 bg-surface-raised border border-border-default rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="lubricated">Huilé / Graissé (K=0.14)</option>
                    <option value="dry">À Sec / Dégraissé (K=0.17)</option>
                  </select>
                </div>
              </div>

              {calcResult && (
                <div className="p-3 rounded-lg bg-surface-raised border border-accent/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">
                      Couple Préconisé ISO 898-1 :
                    </span>
                    <span className="text-base font-black font-mono text-accent">
                      {calcResult.recommendedTorqueNm} N·m
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                    <span>Plage de serrage tolérée (±10%) :</span>
                    <span>{calcResult.minTorqueNm} N·m - {calcResult.maxTorqueNm} N·m</span>
                  </div>
                  <div className="text-[10px] font-mono text-text-muted pt-1 border-t border-border-subtle">
                    {calcResult.formula} • Effort de précharge : {calcResult.clampForceKn} kN
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
