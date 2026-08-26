'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Tabs,
  Spinner,
  CurrencyDisplay,
  ConfirmDialog,
} from '@/components/ui';

interface RepairOrderTemplate {
  id: string;
  name: string;
  category: 'maintenance' | 'repair' | 'inspection' | 'custom';
  description: string;
  default_labor_cost: number;
  default_labor_hours: number;
  items_count: number;
  total_items_cost: number;
  is_active: boolean;
  checkpoints: Array<{ id: string; label: string; category: string }>;
  suggested_parts: string[];
}

export default function RepairTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<RepairOrderTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [reseeding, setReseeding] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/repair-templates');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTemplates(data.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleClone = async (id: string) => {
    setCloningId(id);
    try {
      const res = await fetch(`/api/repair-templates/${id}/clone`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.data?.id) {
        fetchTemplates();
        router.push(`/admin/repair-templates/${data.data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCloningId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/repair-templates/${deleteTargetId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleReseed = async () => {
    setReseeding(true);
    try {
      const res = await fetch('/api/repair-templates/seed', { method: 'POST' });
      if (res.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReseeding(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'maintenance':
        return <Badge variant="info">Entretien & Vidange</Badge>;
      case 'repair':
        return <Badge variant="warning">Réparation Mécanique</Badge>;
      case 'inspection':
        return <Badge variant="info">Diagnostic & Contrôle</Badge>;
      case 'custom':
      default:
        return <Badge variant="neutral">Sur-Mesure</Badge>;
    }
  };

  const filtered = templates.filter((t) => {
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const filterTabs = [
    { key: 'all', label: 'Tous les modèles', count: templates.length },
    { key: 'maintenance', label: 'Entretiens', count: templates.filter((t) => t.category === 'maintenance').length },
    { key: 'repair', label: 'Réparations', count: templates.filter((t) => t.category === 'repair').length },
    { key: 'inspection', label: 'Diagnostics', count: templates.filter((t) => t.category === 'inspection').length },
    { key: 'custom', label: 'Sur-Mesure', count: templates.filter((t) => t.category === 'custom').length },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Modèles d'Ordres de Réparation"
        subtitle="Personnalisez vos forfaits atelier, définissez vos actes de service et configurez vos tarifs recommandés par garage."
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Ordres de réparation', href: '/admin/actions' },
          { label: 'Modèles & Forfaits' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReseed}
              isLoading={reseeding}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Réinitialiser Modèles Standard
            </Button>
            <Link href="/admin/repair-templates/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Nouveau Modèle
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs
          tabs={filterTabs}
          activeKey={categoryFilter}
          onChange={setCategoryFilter}
          variant="pills"
        />

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Rechercher un modèle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-surface-raised border border-border-default rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-text-muted">Chargement des modèles d'atelier...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <p className="text-sm font-bold text-text-primary">Aucun modèle trouvé</p>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Créez votre premier modèle d'ordre de réparation sur-mesure ou réinitialisez les modèles standards.
          </p>
          <Link href="/admin/repair-templates/new">
            <Button variant="primary" size="sm">
              Créer un modèle
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tmpl) => {
            const totalEstimated = tmpl.total_items_cost + tmpl.default_labor_cost;

            return (
              <Card
                key={tmpl.id}
                className="p-5 flex flex-col justify-between space-y-4 hover:border-accent/40 transition-all border border-border-default group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    {getCategoryBadge(tmpl.category)}
                    <span className="text-[11px] font-mono text-text-muted font-semibold">
                      {tmpl.items_count} acte{tmpl.items_count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                    {tmpl.name}
                  </h3>

                  {tmpl.description && (
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  )}

                  {/* Highlights */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-text-muted block">Temps Estimé</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {tmpl.default_labor_hours} heure{tmpl.default_labor_hours > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-text-muted block">Tarif Estimé HT</span>
                      <span className="font-mono font-bold text-accent">
                        <CurrencyDisplay amount={totalEstimated} currency="DZD" />
                      </span>
                    </div>
                  </div>

                  {tmpl.checkpoints && tmpl.checkpoints.length > 0 && (
                    <div className="text-[10px] text-text-muted flex items-center gap-1.5 pt-1">
                      <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{tmpl.checkpoints.length} points de contrôle qualité</span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border-subtle gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => handleClone(tmpl.id)}
                      isLoading={cloningId === tmpl.id}
                      title="Dupliquer ce modèle"
                    >
                      Dupliquer
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setDeleteTargetId(tmpl.id)}
                      className="text-danger hover:bg-danger/10"
                      title="Supprimer ce modèle"
                    >
                      Supprimer
                    </Button>
                  </div>

                  <Link href={`/admin/repair-templates/${tmpl.id}`}>
                    <Button variant="secondary" size="xs">
                      Modifier →
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
        title="Supprimer le modèle d'ordre de réparation"
        description="Êtes-vous sûr de vouloir supprimer ce modèle ? Les ordres de réparation déjà créés avec ce modèle ne seront pas affectés."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
