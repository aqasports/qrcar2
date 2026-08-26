'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  DataTable,
  ColumnDef,
  Modal,
  Button,
  Input,
  Select,
  Badge,
  Tabs,
  CurrencyDisplay,
  DropdownMenu,
} from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { useI18n } from '@/lib/i18n/I18nProvider';

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
  const { t, locale } = useI18n();
  const role = session?.user?.role;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger'>('catalog');
  const [parts, setParts] = useState<Part[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parts');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setParts(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch parts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock');
      const json = await res.json();
      const rawList = json?.data !== undefined ? json.data : json;
      if (Array.isArray(rawList)) {
        setMovements(rawList);
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchParts();
    } else {
      fetchLedger();
    }
  }, [activeTab, fetchParts, fetchLedger]);

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

    const payload: Record<string, unknown> = {
      name: partName.trim(),
      category: partCategory.trim(),
      sku: partSku.trim().toUpperCase(),
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
        throw new Error(data.error || 'Erreur lors de l’enregistrement de la pièce.');
      }

      toast.success(isEditingPart ? 'Pièce mise à jour avec succès.' : 'Nouvelle référence créée dans le catalogue.');
      setShowPartModal(false);
      fetchParts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de communication.';
      setCatalogError(msg);
      toast.error(msg);
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
          reason: adjustReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du mouvement de stock.');
      }

      toast.success('Mouvement de stock enregistré avec succès.');
      setShowAdjustModal(false);
      if (activeTab === 'catalog') {
        fetchParts();
      } else {
        fetchLedger();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue.';
      setAdjustError(msg);
      toast.error(msg);
    } finally {
      setSavingAdjustment(false);
    }
  };

  const catalogColumns: ColumnDef<Part>[] = [
    {
      key: 'sku',
      header: t.inventory.reference,
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold px-2 py-0.5 rounded bg-surface-base border border-border-default text-accent text-xs">
          {p.sku}
        </span>
      ),
    },
    {
      key: 'name',
      header: t.inventory.name,
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-bold text-text-primary block">{p.name}</span>
          <span className="text-[11px] text-text-muted capitalize">{p.category || 'Général'}</span>
        </div>
      ),
    },
    {
      key: 'quantity_in_stock',
      header: t.inventory.stockQty,
      sortable: true,
      align: 'right',
      render: (p) => {
        const isLow = p.quantity_in_stock <= p.min_stock_threshold;
        return (
          <div className="inline-flex items-center gap-1.5 justify-end">
            <span className={`font-mono font-bold text-xs ${isLow ? 'text-rose-400' : 'text-text-primary'}`}>
              {p.quantity_in_stock} {p.unit}
            </span>
            {isLow && (
              <Badge variant="danger" size="sm">
                {t.inventory.lowStockAlert}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'purchase_price',
      header: t.inventory.unitCost,
      sortable: true,
      align: 'right',
      render: (p) => <CurrencyDisplay amount={p.purchase_price} size="sm" />,
    },
    {
      key: 'sale_price',
      header: t.inventory.salePrice,
      sortable: true,
      align: 'right',
      render: (p) => <CurrencyDisplay amount={p.sale_price} size="sm" className="text-accent" />,
    },
    {
      key: 'actions',
      header: t.common.actions_label,
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="secondary" size="xs" onClick={() => handleOpenAdjust(p)}>
            {t.inventory.stockMovement}
          </Button>
          {role !== 'technician' && (
            <DropdownMenu
              trigger={
                <button type="button" className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              }
              sections={[
                {
                  items: [
                    { label: t.common.edit, onClick: () => handleOpenEditPart(p) },
                    { label: t.inventory.stockMovement, onClick: () => setActiveTab('ledger') },
                  ],
                },
              ]}
            />
          )}
        </div>
      ),
    },
  ];

  const ledgerColumns: ColumnDef<StockMovement>[] = [
    {
      key: 'created_at',
      header: t.common.date,
      sortable: true,
      render: (m) => (
        <span className="text-text-muted font-mono text-xs">
          {new Date(m.created_at).toLocaleString(locale === 'ar' ? 'ar-DZ' : locale === 'en' ? 'en-US' : 'fr-DZ')}
        </span>
      ),
    },
    {
      key: 'type',
      header: t.common.type,
      sortable: true,
      render: (m) => (
        <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'danger' : 'info'}>
          {m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Ajustement'}
        </Badge>
      ),
    },
    {
      key: 'part_name',
      header: t.inventory.name,
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-bold text-text-primary">{m.part_name}</span>
          <span className="font-mono text-xs text-text-muted ml-2">[{m.part_sku}]</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: t.common.quantity,
      sortable: true,
      align: 'right',
      render: (m) => (
        <span className={`font-mono font-bold text-xs ${m.type === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}
        </span>
      ),
    },
    {
      key: 'reason',
      header: t.common.notes,
      render: (m) => (
        <span className="text-text-secondary text-xs truncate max-w-xs block">
          {m.reason || 'Mouvement standard'}
        </span>
      ),
    },
    {
      key: 'user_name',
      header: 'Opérateur',
      render: (m) => <span className="text-text-muted text-xs">{m.user_name || 'Système'}</span>,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      <PageHeader
        title={t.inventory.title}
        subtitle={t.inventory.subtitle}
        breadcrumbs={[
          { label: t.common.dashboard, href: '/admin' },
          { label: t.inventory.title.split('&')[0] },
        ]}
        actions={
          role !== 'technician' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreatePart}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t.inventory.addPart}
            </Button>
          )
        }
      />

      <Tabs
        tabs={[
          { key: 'catalog', label: t.inventory.title.split('&')[0], count: parts.length },
          { key: 'ledger', label: t.inventory.stockMovement, count: movements.length },
        ]}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'catalog' | 'ledger')}
        variant="pills"
      />

      {activeTab === 'catalog' ? (
        <DataTable<Part>
          columns={catalogColumns}
          data={parts}
          keyExtractor={(p) => String(p.id)}
          loading={loading}
          loadingMessage={t.common.loading}
          emptyTitle={t.common.empty}
          emptyDescription={t.common.noData}
          emptyAction={
            role !== 'technician' ? (
              <Button variant="primary" size="sm" onClick={handleOpenCreatePart}>
                {t.inventory.addPart}
              </Button>
            ) : null
          }
          searchPlaceholder={t.inventory.searchPlaceholder}
          pageSize={15}
        />
      ) : (
        <DataTable<StockMovement>
          columns={ledgerColumns}
          data={movements}
          keyExtractor={(m) => String(m.id)}
          loading={loading}
          loadingMessage={t.common.loading}
          emptyTitle={t.common.empty}
          emptyDescription={t.common.noData}
          searchPlaceholder={t.common.search}
          pageSize={15}
        />
      )}

      {/* Part Create/Edit Modal */}
      <Modal
        isOpen={showPartModal}
        onClose={() => setShowPartModal(false)}
        title={isEditingPart ? t.common.edit : t.inventory.addPart}
        description={t.inventory.subtitle}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" size="sm" onClick={() => setShowPartModal(false)} disabled={savingPart}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSavePart} isLoading={savingPart}>
              {t.common.save}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSavePart} className="space-y-4">
          {catalogError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {catalogError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t.inventory.name}
              required
              placeholder="ex. Filtre à Huile Purflux"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
            />
            <Input
              label={t.inventory.reference}
              required
              placeholder="ex. LS932"
              value={partSku}
              onChange={(e) => setPartSku(e.target.value)}
              className="font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t.inventory.category}
              placeholder="ex. Filtration, Freinage, Allumage"
              value={partCategory}
              onChange={(e) => setPartCategory(e.target.value)}
            />
            <Select
              label={t.common.type}
              value={partUnit}
              onChange={(e) => setPartUnit(e.target.value)}
              options={[
                { value: 'piece', label: 'Pièce (u)' },
                { value: 'liter', label: 'Litre (L)' },
                { value: 'set', label: 'Jeu / Kit (set)' },
                { value: 'kg', label: 'Kilogramme (kg)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t.inventory.unitCost} (${t.common.currency})`}
              type="number"
              step="0.01"
              required
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
            <Input
              label={`${t.inventory.salePrice} (${t.common.currency})`}
              type="number"
              step="0.01"
              required
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isEditingPart && (
              <Input
                label={t.inventory.stockQty}
                type="number"
                required
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
              />
            )}
            <Input
              label={t.inventory.minStock}
              type="number"
              required
              value={minThreshold}
              onChange={(e) => setMinThreshold(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title={t.inventory.stockMovement}
        description={`Enregistrer une entrée ou sortie de stock pour : ${adjustPartName}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="ghost" size="sm" onClick={() => setShowAdjustModal(false)} disabled={savingAdjustment}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAdjustment} isLoading={savingAdjustment}>
              {t.common.confirm}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          {adjustError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              {adjustError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t.common.type}
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as 'in' | 'out' | 'adjustment')}
              options={[
                { value: 'in', label: 'Entrée / Réception Fournisseur' },
                { value: 'out', label: 'Sortie / Dépréciation' },
                { value: 'adjustment', label: 'Régularisation d’Inventaire' },
              ]}
            />

            <Input
              label={t.common.quantity}
              type="number"
              min="1"
              required
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />
          </div>

          <Input
            label={t.common.notes}
            placeholder="ex. Facture Fournisseur #1283 ou Ajustement inventaire"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
