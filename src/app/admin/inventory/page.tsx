'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableLoadingState,
  TableEmptyState,
  Modal,
  Button,
  Input,
  Select,
  Badge,
} from '@/components/ui';

interface Part {
  id: string;
  name: string;
  category: string;
  sku: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  quantity_in_stock: number;
  min_stock_threshold: number;
  active: boolean;
}

interface StockMovement {
  id: string;
  part_name: string;
  part_sku: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string | null;
  user_name: string;
  created_at: string;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger'>('catalog');
  const [parts, setParts] = useState<Part[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Catalog Modals
  const [showPartModal, setShowPartModal] = useState(false);
  const [isEditingPart, setIsEditingPart] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState('');
  const [partSku, setPartSku] = useState('');
  const [partUnit, setPartUnit] = useState('piece');
  const [purchasePrice, setPurchasePrice] = useState('1000.00');
  const [salePrice, setSalePrice] = useState('1500.00');
  const [initialQty, setInitialQty] = useState('0');
  const [minThreshold, setMinThreshold] = useState('5');
  const [partActive, setPartActive] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [savingPart, setSavingPart] = useState(false);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustPartId, setAdjustPartId] = useState('');
  const [adjustPartName, setAdjustPartName] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustQty, setAdjustQty] = useState('1');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  const fetchParts = async (search = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parts?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setParts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMovements(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchParts(searchQuery);
    } else {
      fetchLedger();
    }
  }, [activeTab, searchQuery]);

  const handleOpenCreatePart = () => {
    setIsEditingPart(false);
    setPartName('');
    setPartCategory('');
    setPartSku('');
    setPartUnit('piece');
    setPurchasePrice('1000.00');
    setSalePrice('1500.00');
    setInitialQty('0');
    setMinThreshold('5');
    setPartActive(true);
    setCatalogError('');
    setShowPartModal(true);
  };

  const handleOpenEditPart = (p: Part) => {
    setIsEditingPart(true);
    setSelectedPartId(p.id);
    setPartName(p.name);
    setPartCategory(p.category);
    setPartSku(p.sku);
    setPartUnit(p.unit);
    setPurchasePrice(p.purchase_price.toString());
    setSalePrice(p.sale_price.toString());
    setMinThreshold(p.min_stock_threshold.toString());
    setPartActive(p.active);
    setCatalogError('');
    setShowPartModal(true);
  };

  const handleOpenAdjust = (p: Part) => {
    setAdjustPartId(p.id);
    setAdjustPartName(p.name);
    setAdjustType('in');
    setAdjustQty('1');
    setAdjustReason('');
    setAdjustError('');
    setShowAdjustModal(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPart(true);
    setCatalogError('');

    const payload: any = {
      name: partName,
      category: partCategory,
      sku: partSku,
      unit: partUnit,
      purchase_price: parseFloat(purchasePrice) || 0,
      sale_price: parseFloat(salePrice) || 0,
      min_stock_threshold: parseInt(minThreshold, 10) || 0,
      active: partActive,
    };

    if (!isEditingPart) {
      payload.quantity_in_stock = parseInt(initialQty, 10) || 0;
    }

    try {
      const url = isEditingPart ? `/api/parts/${selectedPartId}` : '/api/parts';
      const method = isEditingPart ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCatalogError(data.error || 'Erreur lors de l’enregistrement de la pièce.');
      } else {
        setShowPartModal(false);
        fetchParts(searchQuery);
      }
    } catch (err) {
      setCatalogError('Erreur de communication avec le serveur.');
    } finally {
      setSavingPart(false);
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdjustment(true);
    setAdjustError('');

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_id: adjustPartId,
          type: adjustType,
          quantity: parseInt(adjustQty, 10) || 1,
          reason: adjustReason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdjustError(data.error || 'Erreur lors du mouvement de stock.');
      } else {
        setShowAdjustModal(false);
        if (activeTab === 'catalog') {
          fetchParts(searchQuery);
        } else {
          fetchLedger();
        }
      }
    } catch (err) {
      setAdjustError('Erreur de communication avec le serveur.');
    } finally {
      setSavingAdjustment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Stock & Magasin de Pièces"
        subtitle="Catalogue des références, niveaux d'alerte et journal des mouvements"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Stock & Pièces' },
        ]}
        actions={
          role !== 'technician' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreatePart}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nouvelle Référence
            </Button>
          )
        }
      />

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'catalog'
                ? 'border-accent text-white'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Catalogue ({parts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'ledger'
                ? 'border-accent text-white'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Journal des Entrées / Sorties
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="max-w-xs w-full">
            <Input
              placeholder="Filtrer par nom, référence ou catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Main Content */}
      {activeTab === 'catalog' ? (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Référence / SKU</TableHead>
              <TableHead>Désignation Pièce</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Stock Actuel</TableHead>
              <TableHead className="text-right">Prix d&apos;Achat</TableHead>
              <TableHead className="text-right">Prix de Vente</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingState colSpan={7} message="Chargement de l'inventaire..." />
            ) : parts.length === 0 ? (
              <TableEmptyState
                colSpan={7}
                title="Aucune pièce trouvée"
                description="Aucun article ne correspond à votre recherche."
                action={
                  role !== 'technician' ? (
                    <Button variant="primary" size="sm" onClick={handleOpenCreatePart}>
                      Créer une Première Référence
                    </Button>
                  ) : null
                }
              />
            ) : (
              parts.map((p) => {
                const isLowStock = p.quantity_in_stock <= p.min_stock_threshold;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-text-muted">
                      {p.sku}
                    </TableCell>
                    <TableCell className="font-bold text-text-primary">
                      {p.name}
                    </TableCell>
                    <TableCell className="text-text-muted capitalize">
                      {p.category || 'Général'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <span className={`font-mono font-bold ${isLowStock ? 'text-rose-400' : 'text-text-primary'}`}>
                          {p.quantity_in_stock} {p.unit}
                        </span>
                        {isLowStock && (
                          <Badge variant="danger" size="sm">
                            Alerte
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-text-muted">
                      {p.purchase_price.toLocaleString()} DZD
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-accent">
                      {p.sale_price.toLocaleString()} DZD
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAdjust(p)}
                        >
                          Ajuster
                        </Button>
                        {role !== 'technician' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditPart(p)}
                          >
                            Modifier
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Pièce</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead>Motif / Intervention</TableHead>
              <TableHead>Opérateur</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableLoadingState colSpan={6} message="Chargement du journal des mouvements..." />
            ) : movements.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                title="Aucun mouvement de stock"
                description="Le journal ne contient encore aucune entrée ou sortie de marchandise."
              />
            ) : (
              movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-text-muted whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'danger' : 'info'}>
                      {m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Ajustement'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-text-primary">
                    {m.part_name} <span className="font-mono text-xs text-text-muted">[{m.part_sku}]</span>
                  </TableCell>
                  <TableCell className={`text-right font-mono font-bold ${m.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}
                  </TableCell>
                  <TableCell className="text-text-secondary text-xs">
                    {m.reason || 'Mouvement standard'}
                  </TableCell>
                  <TableCell className="text-text-muted text-xs">
                    {m.user_name || 'Système'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Part Create/Edit Modal */}
      <Modal
        isOpen={showPartModal}
        onClose={() => setShowPartModal(false)}
        title={isEditingPart ? 'Modifier la Référence Pièce' : 'Nouvelle Référence au Catalogue'}
        description="Renseignez les détails techniques, le conditionnement et les tarifs de l'article."
        size="lg"
      >
        <form onSubmit={handleSavePart} className="space-y-4">
          {catalogError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {catalogError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Désignation Pièce"
              required
              placeholder="ex. Filtre à Huile Purflux"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
            />
            <Input
              label="Référence / SKU"
              required
              placeholder="ex. LS932"
              value={partSku}
              onChange={(e) => setPartSku(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Catégorie"
              placeholder="ex. Filtration, Freinage, Allumage"
              value={partCategory}
              onChange={(e) => setPartCategory(e.target.value)}
            />
            <Select
              label="Unité de Compte"
              value={partUnit}
              onChange={(e) => setPartUnit(e.target.value)}
            >
              <option value="piece">Pièce (u)</option>
              <option value="liter">Litre (L)</option>
              <option value="set">Jeu / Kit (set)</option>
              <option value="kg">Kilogramme (kg)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prix d'Achat HT (DZD)"
              type="number"
              step="0.01"
              required
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
            <Input
              label="Prix de Vente TTC (DZD)"
              type="number"
              step="0.01"
              required
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!isEditingPart && (
              <Input
                label="Stock Initial Disponible"
                type="number"
                required
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
              />
            )}
            <Input
              label="Seuil d'Alerte Réapprovisionnement"
              type="number"
              required
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={savingPart} className="flex-1">
              {isEditingPart ? 'Enregistrer les Modifications' : 'Créer la Référence'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowPartModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="Mouvement Manuel de Stock"
        description={`Enregistrer une entrée ou sortie de stock pour : ${adjustPartName}`}
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          {adjustError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {adjustError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Type de Mouvement"
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as any)}
            >
              <option value="in">Entrée / Réception Fournisseur</option>
              <option value="out">Sortie / Dépréciation</option>
              <option value="adjustment">Régularisation d&apos;Inventaire</option>
            </Select>

            <Input
              label="Quantité"
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />
          </div>

          <Input
            label="Motif / Commentaire (Optionnel)"
            placeholder="ex. Facture Fournisseur #1283 ou Ajustement inventaire"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={savingAdjustment} className="flex-1">
              Confirmer le Mouvement
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdjustModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
