'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Badge, CurrencyDisplay } from '@/components/ui';

export interface RepairOrderTemplateOption {
  id: string;
  name: string;
  category: string;
  description?: string;
  default_labor_cost: number;
  default_labor_hours: number;
  items_count?: number;
  total_items_cost?: number;
  checkpoints?: Array<{ id: string; label: string; category: string }>;
  suggested_parts?: string[];
  line_items?: any[];
}

interface TemplateSelectorProps {
  templates: RepairOrderTemplateOption[];
  selectedTemplateId: string | null;
  onSelectTemplate: (template: RepairOrderTemplateOption | null) => void;
  currency?: string;
}

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelectTemplate,
  currency = 'DZD',
}: TemplateSelectorProps) {
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'maintenance':
        return <Badge variant="info">Entretien</Badge>;
      case 'repair':
        return <Badge variant="warning">Réparation</Badge>;
      case 'inspection':
        return <Badge variant="info">Diagnostic</Badge>;
      case 'custom':
      default:
        return <Badge variant="neutral">Sur-Mesure</Badge>;
    }
  };

  return (
    <Card className="p-4 space-y-3 font-sans border border-border-default">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted block">
            Modèles d'Ordre de Réparation Préconfigurés
          </span>
          <p className="text-xs text-text-secondary mt-0.5">
            Sélectionnez un modèle d'atelier pour préremplir instantanément les actes, forfaits et tarifs recommandés.
          </p>
        </div>

        <Link
          href="/admin/repair-templates"
          className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Gérer les modèles</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {/* Blank / Custom Template Option */}
        <button
          type="button"
          onClick={() => onSelectTemplate(null)}
          className={`p-3 rounded-xl text-left transition border flex flex-col justify-between min-h-[95px] ${
            selectedTemplateId === null || selectedTemplateId === ''
              ? 'bg-accent/10 border-accent text-text-primary ring-1 ring-accent'
              : 'bg-surface-base border-border-subtle hover:border-border-default text-text-secondary'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <Badge variant="neutral">Vierge</Badge>
            </div>
            <span className="text-xs font-bold text-text-primary block leading-tight">
              Saisie Libre / Sur-Mesure
            </span>
          </div>
          <span className="text-[10px] text-text-muted mt-2 block">
            Créer un OR sans préremplissage
          </span>
        </button>

        {/* Existing Database Templates */}
        {templates.map((tmpl) => {
          const isSelected = selectedTemplateId === tmpl.id;
          const totalEstimated = (tmpl.total_items_cost || 0) + (tmpl.default_labor_cost || 0);

          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl)}
              className={`p-3 rounded-xl text-left transition border flex flex-col justify-between min-h-[95px] ${
                isSelected
                  ? 'bg-accent/10 border-accent text-text-primary ring-1 ring-accent'
                  : 'bg-surface-base border-border-subtle hover:border-border-default text-text-secondary'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  {getCategoryBadge(tmpl.category)}
                  {tmpl.items_count !== undefined && (
                    <span className="text-[10px] font-mono text-text-muted font-semibold">
                      {tmpl.items_count} acte{tmpl.items_count > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-text-primary block leading-tight truncate">
                  {tmpl.name}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-border-subtle/50 text-[10px]">
                <span className="text-text-muted font-mono">
                  MO: {tmpl.default_labor_hours}h
                </span>
                <span className="font-bold font-mono text-accent">
                  <CurrencyDisplay amount={totalEstimated} currency={currency} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
