'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  Spinner,
  CurrencyDisplay,
  Modal,
} from '@/components/ui';
import { InlineEditCell } from '@/components/repair-order/InlineEditCell';
import crypto from 'crypto';

interface TemplateLineItem {
  id: string;
  name: string;
  description?: string | null;
  item_type: 'service' | 'part' | 'labor' | 'inspection' | string;
  default_unit_price: number;
  default_quantity: number;
  unit?: string;
  linked_part_id?: string | null;
  linked_part_name?: string | null;
  linked_part_sku?: string | null;
  linked_part_stock?: number | null;
  is_required?: boolean;
}

interface Checkpoint {
  id: string;
  label: string;
  category: string;
}

interface CatalogPartOption {
  id: string;
  name: string;
  sku: string;
  sale_price: number;
  quantity_in_stock: number;
  unit?: string;
  category?: string;
}

export default function EditRepairTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'maintenance' | 'repair' | 'inspection' | 'custom'>('maintenance');
  const [description, setDescription] = useState('');
  const [defaultLaborCost, setDefaultLaborCost] = useState('3000');
  const [defaultLaborHours, setDefaultLaborHours] = useState('1.0');
  const [lineItems, setLineItems] = useState<TemplateLineItem[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [catalogParts, setCatalogParts] = useState<CatalogPartOption[]>([]);

  // Modals State
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);

  // New Service State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('2500');
  const [newServiceQty, setNewServiceQty] = useState('1');
  const [newServiceUnit, setNewServiceUnit] = useState('forfait');
  const [newServiceType, setNewServiceType] = useState<'service' | 'labor' | 'inspection'>('service');

  // Part Search State
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState('1');
  const [selectedPartCustomPrice, setSelectedPartCustomPrice] = useState('');

  // New Checkpoint State
  const [newCpLabel, setNewCpLabel] = useState('');
  const [newCpCategory, setNewCpCategory] = useState('Contrôle');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tmplRes, partsRes] = await Promise.all([
          fetch(`/api/repair-templates/${templateId}`),
          fetch('/api/parts'),
        ]);

        const [tmplData, partsData] = await Promise.all([
          tmplRes.json(),
          partsRes.json(),
        ]);

        if (!tmplRes.ok || !tmplData.data) {
          setError(tmplData.error || 'Modèle introuvable.');
        } else {
          const t = tmplData.data;
          setName(t.name || '');
          setCategory(t.category || 'maintenance');
          setDescription(t.description || '');
          setDefaultLaborCost(String(t.default_labor_cost ?? '0'));
          setDefaultLaborHours(String(t.default_labor_hours ?? '1.0'));
          setLineItems(t.line_items || []);
          setCheckpoints(t.checkpoints || []);
        }

        const rawParts = partsData?.data !== undefined ? partsData.data : partsData;
        if (Array.isArray(rawParts)) {
          setCatalogParts(rawParts);
        }
      } catch (err) {
        console.error(err);
        setError('Erreur lors du chargement.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [templateId]);

  const handleUpdateLineItem = (id: string, updates: Partial<TemplateLineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newItem: TemplateLineItem = {
      id: crypto.randomUUID(),
      name: newServiceName.trim(),
      description: newServiceDesc.trim() || null,
      item_type: newServiceType,
      default_unit_price: parseFloat(newServicePrice) || 0,
      default_quantity: parseFloat(newServiceQty) || 1,
      unit: newServiceUnit,
      is_required: false,
    };

    setLineItems((prev) => [...prev, newItem]);
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServicePrice('2500');
    setNewServiceQty('1');
    setNewServiceUnit('forfait');
    setShowAddServiceModal(false);
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    const part = catalogParts.find((p) => p.id === selectedPartId);
    if (!part) return;

    const price = selectedPartCustomPrice !== '' ? parseFloat(selectedPartCustomPrice) || 0 : part.sale_price;

    const newItem: TemplateLineItem = {
      id: crypto.randomUUID(),
      name: part.name,
      description: `Réf SKU: ${part.sku}`,
      item_type: 'part',
      default_unit_price: price,
      default_quantity: parseFloat(selectedPartQty) || 1,
      unit: part.unit || 'u',
      linked_part_id: part.id,
      linked_part_name: part.name,
      linked_part_sku: part.sku,
      linked_part_stock: part.quantity_in_stock,
      is_required: false,
    };

    setLineItems((prev) => [...prev, newItem]);
    setSelectedPartId('');
    setSelectedPartQty('1');
    setSelectedPartCustomPrice('');
    setPartSearch('');
    setShowAddPartModal(false);
  };

  const handleAddCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCpLabel.trim()) return;

    setCheckpoints((prev) => [
      ...prev,
      {
        id: `cp_${Date.now()}`,
        label: newCpLabel.trim(),
        category: newCpCategory.trim() || 'Contrôle',
      },
    ]);

    setNewCpLabel('');
    setShowAddCheckpointModal(false);
  };

  const handleRemoveCheckpoint = (id: string) => {
    setCheckpoints((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom du modèle est obligatoire.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        default_labor_cost: parseFloat(defaultLaborCost) || 0,
        default_labor_hours: parseFloat(defaultLaborHours) || 1.0,
        checkpoints,
        line_items: lineItems.map((item, idx) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          item_type: item.item_type,
          default_unit_price: item.default_unit_price,
          default_quantity: item.default_quantity,
          unit: item.unit || 'u',
          linked_part_id: item.linked_part_id,
          is_required: item.is_required,
          sort_order: idx,
        })),
      };

      const res = await fetch(`/api/repair-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l’enregistrement.');
      } else {
        setSuccessMessage('Modèle d’ordre de réparation mis à jour avec succès.');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur de connexion au serveur.');
    } finally {
      setSaving(false);
    }
  };

  const itemsTotal = lineItems.reduce(
    (acc, itm) => acc + itm.default_quantity * itm.default_unit_price,
    0
  );
  const laborTotal = parseFloat(defaultLaborCost) || 0;
  const estimatedTotal = itemsTotal + laborTotal;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement du modèle...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      <PageHeader
        title={`Modifier : ${name}`}
        subtitle="Personnalisez les actes, tarifs préconisés et points de contrôle associés à ce modèle d'intervention."
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Modèles', href: '/admin/repair-templates' },
          { label: name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push('/admin/repair-templates')}
            >
              Retour aux modèles
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={saving}>
              Enregistrer les modifications
            </Button>
          </div>
        }
      />

      {error && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-success/10 border border-success/25 text-success text-xs font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Section 1: Template Metadata */}
      <Card className="p-5 space-y-4 border border-border-default">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Informations Générales du Modèle
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Intitulé du Modèle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vidange Complète & Filtres, Forfait Freinage AV..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Catégorie Métier
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="maintenance">Entretien & Vidange</option>
              <option value="repair">Réparation Mécanique</option>
              <option value="inspection">Diagnostic & Contrôle</option>
              <option value="custom">Sur-Mesure</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
            Description des travaux types (Pré-remplie sur l'OR)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Détail des opérations courantes couvertes par ce forfait..."
            className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle">
          <Input
            type="number"
            label="Main d'œuvre Forfaitaire Recommandée (DZD)"
            value={defaultLaborCost}
            onChange={(e) => setDefaultLaborCost(e.target.value)}
            min="0"
            step="100"
          />
          <Input
            type="number"
            label="Temps Moyen Estimé (Heures)"
            value={defaultLaborHours}
            onChange={(e) => setDefaultLaborHours(e.target.value)}
            min="0.25"
            step="0.25"
          />
        </div>
      </Card>

      {/* Section 2: Line Items (Acts & Stock Parts) */}
      <Card className="p-5 space-y-4 border border-border-default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Actes, Prestations & Pièces du Modèle ({lineItems.length})
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Définissez les lignes par défaut qui seront injectées lors de la création d'un ordre de réparation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => setShowAddServiceModal(true)}
            >
              + Prestation
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => setShowAddPartModal(true)}
            >
              + Pièce Stock
            </Button>
          </div>
        </div>

        {lineItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-text-muted">
            Aucune ligne définie pour ce modèle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-[10px] font-bold uppercase text-text-muted">
                  <th className="py-2 px-2.5 w-8">#</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Désignation</th>
                  <th className="py-2 px-2.5 w-24 text-center">Quantité</th>
                  <th className="py-2 px-2.5 w-32 text-right">Tarif HT</th>
                  <th className="py-2 px-2.5 w-28 text-right">Total</th>
                  <th className="py-2 px-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50">
                {lineItems.map((item, idx) => {
                  const lineTotal = item.default_quantity * item.default_unit_price;

                  return (
                    <tr key={item.id} className="hover:bg-surface-hover/40 transition-colors">
                      <td className="py-2.5 px-2.5 text-text-muted font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2.5">
                        <Badge variant={item.item_type === 'part' ? 'warning' : 'info'}>
                          {item.item_type === 'part' ? 'Pièce' : 'Prestation'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <InlineEditCell
                          value={item.name}
                          onSave={(val) => handleUpdateLineItem(item.id, { name: val })}
                          className="font-bold text-text-primary block"
                        />
                        {item.description && (
                          <span className="text-[10px] text-text-muted block truncate max-w-xs">
                            {item.description}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <InlineEditCell
                            type="number"
                            min={0.1}
                            step="1"
                            value={item.default_quantity}
                            onSave={(val) => handleUpdateLineItem(item.id, { default_quantity: parseFloat(val) || 1 })}
                            className="font-mono font-semibold"
                          />
                          <span className="text-[10px] text-text-muted">{item.unit || 'u'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2.5 text-right">
                        <InlineEditCell
                          type="number"
                          min={0}
                          step={100}
                          value={item.default_unit_price}
                          onSave={(val) => handleUpdateLineItem(item.id, { default_unit_price: parseFloat(val) || 0 })}
                          suffix=" DZD"
                          className="font-mono font-semibold text-right"
                        />
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono font-bold text-text-primary">
                        <CurrencyDisplay amount={lineTotal} currency="DZD" />
                      </td>
                      <td className="py-2.5 px-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Estimated Total Preview */}
        <div className="flex items-center justify-end gap-6 pt-3 border-t border-border-subtle text-xs font-mono">
          <div>
            <span className="text-text-muted">Lignes : </span>
            <span className="font-bold text-text-primary"><CurrencyDisplay amount={itemsTotal} currency="DZD" /></span>
          </div>
          <div>
            <span className="text-text-muted">Main d'œuvre : </span>
            <span className="font-bold text-text-primary"><CurrencyDisplay amount={laborTotal} currency="DZD" /></span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent font-bold">
            <span>Total Forfait Estimé : </span>
            <CurrencyDisplay amount={estimatedTotal} currency="DZD" />
          </div>
        </div>
      </Card>

      {/* Section 3: Quality Checkpoints */}
      <Card className="p-5 space-y-4 border border-border-default">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Points de Contrôle Qualité ({checkpoints.length})
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Check-list d'inspection associée à ce type d'intervention (sécurité, conformité, niveaux).
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => setShowAddCheckpointModal(true)}
          >
            + Point de contrôle
          </Button>
        </div>

        {checkpoints.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">
            Aucun point de contrôle configuré pour ce modèle.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="p-2.5 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase text-accent block">
                    {cp.category}
                  </span>
                  <span className="text-xs text-text-primary font-medium block">
                    {cp.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCheckpoint(cp.id)}
                  className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/repair-templates')}
        >
          Annuler
        </Button>
        <Button type="submit" variant="primary" isLoading={saving}>
          Enregistrer le modèle
        </Button>
      </div>

      {/* Modal 1: Add Service */}
      <Modal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        title="Ajouter une Prestation au Modèle"
        size="md"
      >
        <form onSubmit={handleAddService} className="space-y-4 font-sans">
          <Input
            label="Désignation"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            placeholder="Ex: Contrôle circuit de distribution, Forfait Révision..."
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={newServiceType}
                onChange={(e) => setNewServiceType(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="service">Prestation</option>
                <option value="labor">Main d'œuvre</option>
                <option value="inspection">Contrôle / Diagnostic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Unité
              </label>
              <select
                value={newServiceUnit}
                onChange={(e) => setNewServiceUnit(e.target.value)}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="forfait">Forfait</option>
                <option value="h">Heure (h)</option>
                <option value="u">Unité (u)</option>
                <option value="set">Jeu / Kit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Tarif Conseillé (DZD)"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              min="0"
              step="100"
              required
            />
            <Input
              type="number"
              label="Quantité par défaut"
              value={newServiceQty}
              onChange={(e) => setNewServiceQty(e.target.value)}
              min="0.1"
              step="0.5"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddServiceModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Part */}
      <Modal
        isOpen={showAddPartModal}
        onClose={() => setShowAddPartModal(false)}
        title="Ajouter une Pièce du Stock au Modèle"
        size="lg"
      >
        <form onSubmit={handleAddPart} className="space-y-4 font-sans">
          <Input
            placeholder="Rechercher une pièce..."
            value={partSearch}
            onChange={(e) => setPartSearch(e.target.value)}
          />

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-border-subtle rounded-xl p-2 bg-surface-base/40">
            {catalogParts
              .filter(
                (p) =>
                  p.name.toLowerCase().includes(partSearch.toLowerCase()) ||
                  p.sku.toLowerCase().includes(partSearch.toLowerCase())
              )
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPartId(p.id);
                    setSelectedPartCustomPrice(String(p.sale_price || '0'));
                  }}
                  className={`w-full p-2.5 rounded-lg text-left transition flex items-center justify-between border ${
                    selectedPartId === p.id
                      ? 'bg-accent/10 border-accent/60 text-text-primary'
                      : 'bg-surface-base border-border-subtle hover:border-border-default text-text-secondary'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs text-text-primary block">{p.name}</span>
                    <span className="text-[10px] font-mono text-text-muted">SKU: {p.sku}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-accent">
                    <CurrencyDisplay amount={p.sale_price} currency="DZD" />
                  </span>
                </button>
              ))}
          </div>

          {selectedPartId && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-surface-raised rounded-xl border border-border-default">
              <Input
                type="number"
                label="Quantité type"
                value={selectedPartQty}
                onChange={(e) => setSelectedPartQty(e.target.value)}
                min="1"
                required
              />
              <Input
                type="number"
                label="Tarif par défaut (DZD)"
                value={selectedPartCustomPrice}
                onChange={(e) => setSelectedPartCustomPrice(e.target.value)}
                min="0"
                step="50"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddPartModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!selectedPartId}>
              Insérer la pièce
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Add Checkpoint */}
      <Modal
        isOpen={showAddCheckpointModal}
        onClose={() => setShowAddCheckpointModal(false)}
        title="Ajouter un Point de Contrôle Qualité"
        size="md"
      >
        <form onSubmit={handleAddCheckpoint} className="space-y-4 font-sans">
          <Input
            label="Libellé du point de contrôle"
            placeholder="Ex: Contrôle étanchéité pompe à eau, Serrage vis culasse..."
            value={newCpLabel}
            onChange={(e) => setNewCpLabel(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              Catégorie
            </label>
            <input
              type="text"
              value={newCpCategory}
              onChange={(e) => setNewCpCategory(e.target.value)}
              placeholder="Ex: Moteur, Freinage, Sécurité, Niveaux..."
              className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddCheckpointModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Ajouter le point
            </Button>
          </div>
        </form>
      </Modal>
    </form>
  );
}
