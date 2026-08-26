'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageHeader,
  Card,
  Button,
  Input,
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
}

export default function NewRepairTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'maintenance' | 'repair' | 'inspection' | 'custom'>('maintenance');
  const [description, setDescription] = useState('');
  const [defaultLaborCost, setDefaultLaborCost] = useState('3000');
  const [defaultLaborHours, setDefaultLaborHours] = useState('1.0');
  const [lineItems, setLineItems] = useState<TemplateLineItem[]>([]);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [catalogParts, setCatalogParts] = useState<CatalogPartOption[]>([]);

  // Modals
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);

  // New Service
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('2500');
  const [newServiceQty, setNewServiceQty] = useState('1');
  const [newServiceUnit, setNewServiceUnit] = useState('forfait');
  const [newServiceType, setNewServiceType] = useState<'service' | 'labor' | 'inspection'>('service');

  // Part Search
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [selectedPartQty, setSelectedPartQty] = useState('1');
  const [selectedPartCustomPrice, setSelectedPartCustomPrice] = useState('');

  // Checkpoint
  const [newCpLabel, setNewCpLabel] = useState('');
  const [newCpCategory, setNewCpCategory] = useState('Contrôle');

  useEffect(() => {
    async function loadParts() {
      try {
        const res = await fetch('/api/parts');
        const data = await res.json();
        const raw = data?.data !== undefined ? data.data : data;
        if (Array.isArray(raw)) setCatalogParts(raw);
      } catch (err) {
        console.error(err);
      }
    }
    loadParts();
  }, []);

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newServiceName.trim(),
        description: newServiceDesc.trim() || null,
        item_type: newServiceType,
        default_unit_price: parseFloat(newServicePrice) || 0,
        default_quantity: parseFloat(newServiceQty) || 1,
        unit: newServiceUnit,
      },
    ]);

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

    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: part.name,
        description: `Réf SKU: ${part.sku}`,
        item_type: 'part',
        default_unit_price: price,
        default_quantity: parseFloat(selectedPartQty) || 1,
        unit: part.unit || 'u',
        linked_part_id: part.id,
      },
    ]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Veuillez renseigner le nom du modèle.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        default_labor_cost: parseFloat(defaultLaborCost) || 0,
        default_labor_hours: parseFloat(defaultLaborHours) || 1.0,
        checkpoints,
        line_items: lineItems.map((item, idx) => ({
          name: item.name,
          description: item.description,
          item_type: item.item_type,
          default_unit_price: item.default_unit_price,
          default_quantity: item.default_quantity,
          unit: item.unit || 'u',
          linked_part_id: item.linked_part_id,
          sort_order: idx,
        })),
      };

      const res = await fetch('/api/repair-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du modèle.');
      } else {
        router.push('/admin/repair-templates');
      }
    } catch (err) {
      console.error(err);
      setError('Erreur de communication.');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16 font-sans">
      <PageHeader
        title="Créer un Modèle d'Ordre de Réparation"
        subtitle="Définissez un forfait sur-mesure pour votre atelier avec vos prestations types et tarifs conseillés."
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Modèles', href: '/admin/repair-templates' },
          { label: 'Nouveau Modèle' },
        ]}
      />

      {error && (
        <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Section 1 */}
      <Card className="p-5 space-y-4 border border-border-default">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
          Informations Générales
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Intitulé du Modèle"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Forfait Révision 30 000 km, Remplacement Embrayage..."
              required
              autoFocus
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
            Description des travaux types
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

      {/* Section 2: Line Items */}
      <Card className="p-5 space-y-4 border border-border-default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Actes, Prestations & Pièces ({lineItems.length})
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Ces lignes seront injectées par défaut à chaque sélection de ce modèle.
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
          <div className="py-6 text-center text-xs text-text-muted border border-dashed border-border-default rounded-xl">
            Aucun acte pour le moment. Cliquez sur "+ Prestation" pour ajouter une ligne.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
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
                {lineItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-2.5 text-text-muted font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-2.5 uppercase font-semibold text-[10px] text-accent">
                      {item.item_type}
                    </td>
                    <td className="py-2.5 px-2.5 font-bold text-text-primary">{item.name}</td>
                    <td className="py-2.5 px-2.5 text-center font-mono">{item.default_quantity} {item.unit || 'u'}</td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-semibold">
                      <CurrencyDisplay amount={item.default_unit_price} currency="DZD" />
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold text-text-primary">
                      <CurrencyDisplay amount={item.default_quantity * item.default_unit_price} currency="DZD" />
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => setLineItems((prev) => prev.filter((i) => i.id !== item.id))}
                        className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-end gap-6 pt-3 border-t border-border-subtle text-xs font-mono">
          <div>
            <span className="text-text-muted">Total Forfait Estimé : </span>
            <span className="font-bold text-accent"><CurrencyDisplay amount={estimatedTotal} currency="DZD" /></span>
          </div>
        </div>
      </Card>

      {/* Section 3: Checkpoints */}
      <Card className="p-5 space-y-4 border border-border-default">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Points de Contrôle Qualité ({checkpoints.length})
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Check-list d'inspection associée à ce forfait.
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
            Aucun point de contrôle configuré pour le moment.
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
                  onClick={() => setCheckpoints((prev) => prev.filter((c) => c.id !== cp.id))}
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

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push('/admin/repair-templates')}
        >
          Annuler
        </Button>
        <Button type="submit" variant="primary" isLoading={saving}>
          Créer le modèle
        </Button>
      </div>

      {/* Modal 1: Add Service */}
      <Modal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        title="Ajouter une Prestation"
        size="md"
      >
        <form onSubmit={handleAddService} className="space-y-4 font-sans">
          <Input
            label="Désignation"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            placeholder="Ex: Remplacement filtre d'habitacle..."
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
              label="Quantité type"
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
        title="Sélectionner une Pièce du Stock"
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
            placeholder="Ex: Contrôle étanchéité circuit clim, Serrage écrous de roue..."
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
