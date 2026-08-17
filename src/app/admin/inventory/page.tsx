'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
  const [purchasePrice, setPurchasePrice] = useState('10.00');
  const [salePrice, setSalePrice] = useState('15.00');
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
    setPurchasePrice('10.00');
    setSalePrice('15.00');
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
      purchase_price: parseFloat(purchasePrice) || 0.00,
      sale_price: parseFloat(salePrice) || 0.00,
      min_stock_threshold: parseInt(minThreshold) || 5,
      active: partActive
    };

    if (!isEditingPart) {
      payload.quantity_in_stock = parseInt(initialQty) || 0;
    }

    try {
      let res;
      if (isEditingPart) {
        res = await fetch(`/api/parts/${selectedPartId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/parts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setCatalogError(data.error || 'Failed to save part catalog file');
      } else {
        setShowPartModal(false);
        fetchParts(searchQuery);
      }
    } catch (err) {
      setCatalogError('Network connection failure.');
    } finally {
      setSavingPart(false);
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdjustment(true);
    setAdjustError('');

    try {
      const res = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_id: adjustPartId,
          type: adjustType,
          quantity: parseInt(adjustQty),
          reason: adjustReason
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAdjustError(data.error || 'Failed to apply stock adjustment');
      } else {
        setShowAdjustModal(false);
        fetchParts(searchQuery);
      }
    } catch (err) {
      setAdjustError('Communication failure during adjustment saving.');
    } finally {
      setSavingAdjustment(false);
    }
  };

  if (role === 'technician') {
    return (
      <div className="text-red-400 p-8 text-center bg-slate-900 border border-red-500/10 rounded-2xl max-w-xl mx-auto">
        Access Denied. Inventory administration is restricted to managers and super admins.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Inventory & Stock</h2>
          <p className="text-slate-400 text-sm mt-1">Catalog items, supplier references, and stock movements ledger</p>
        </div>

        {/* Tab Switcher & Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'catalog' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Parts Catalog
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ledger' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Stock Ledger
            </button>
          </div>

          {activeTab === 'catalog' && (
            <button
              onClick={handleOpenCreatePart}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition duration-150 active:scale-[0.98] shadow-lg shadow-blue-500/10"
            >
              New Part
            </button>
          )}
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search catalog by name, sku, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition duration-150 text-sm"
            />
          </div>

          {/* Parts list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading catalog items...</div>
            ) : parts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No parts found in inventory catalog.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/30">
                      <th className="px-6 py-4">Part Details</th>
                      <th className="px-6 py-4">SKU / Code</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 text-right">Purchase Price</th>
                      <th className="px-6 py-4 text-right">Sale Price</th>
                      <th className="px-6 py-4 text-center">Stock Level</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {parts.map((p) => {
                      const isLowStock = p.quantity_in_stock <= p.min_stock_threshold;
                      return (
                        <tr key={p.id} className="hover:bg-slate-850/30 transition duration-100">
                          <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                            {p.name}
                            {!p.active && (
                              <span className="ml-2 text-[9px] bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.2 rounded font-bold uppercase">
                                inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-slate-300">{p.sku}</td>
                          <td className="px-6 py-4 text-sm text-slate-400 capitalize">{p.category}</td>
                          <td className="px-6 py-4 text-sm text-right text-slate-400 font-mono">${Number(p.purchase_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-right text-slate-200 font-bold font-mono">${Number(p.sale_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className={`inline-block font-mono font-bold text-xs px-2.5 py-1 rounded ${
                              isLowStock
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-slate-950/40 text-slate-300 border border-slate-800'
                            }`}>
                              {p.quantity_in_stock} {p.unit}
                            </span>
                            {isLowStock && p.active && (
                              <span className="block text-[8px] text-red-500 font-bold uppercase tracking-wide mt-1">
                                Under threshold ({p.min_stock_threshold})
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-right space-x-2">
                            <button
                              onClick={() => handleOpenAdjust(p)}
                              className="text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-2 py-1 rounded"
                            >
                              Adjust Stock
                            </button>
                            <button
                              onClick={() => handleOpenEditPart(p)}
                              className="text-xs font-bold text-blue-500 hover:text-blue-400"
                            >
                              Edit File
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Stock movement ledger log */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading ledger logs...</div>
          ) : movements.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No stock movements found in ledger log.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-950/30">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Catalog Part</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Move Type</th>
                    <th className="px-6 py-4 text-center">Qty Delta</th>
                    <th className="px-6 py-4">Logged By</th>
                    <th className="px-6 py-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-850/30 transition duration-100 text-sm">
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200">{m.part_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{m.part_sku}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          m.type === 'in'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : m.type === 'out'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-200">
                        {m.quantity > 0 && m.type !== 'out' ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">{m.user_name}</td>
                      <td className="px-6 py-4 text-slate-300 italic truncate max-w-xs">{m.reason || 'Manual ledger adjust'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Part Create/Edit Modal */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <h3 className="text-xl font-bold text-slate-100 mb-4">
              {isEditingPart ? 'Edit Catalog Part' : 'Add Catalog Item'}
            </h3>

            {catalogError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {catalogError}
              </div>
            )}

            <form onSubmit={handleSavePart} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Part Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Brake Pad Kit"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. brakes, engine, filter"
                    value={partCategory}
                    onChange={(e) => setPartCategory(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BRK-88910"
                    value={partSku}
                    onChange={(e) => setPartSku(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. piece, liter, set"
                    value={partUnit}
                    onChange={(e) => setPartUnit(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Purchase Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Min Stock Threshold</label>
                  <input
                    type="number"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>

                {!isEditingPart && (
                  <div>
                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Initial Stock Import</label>
                    <input
                      type="number"
                      required
                      value={initialQty}
                      onChange={(e) => setInitialQty(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                    />
                  </div>
                )}
              </div>

              {isEditingPart && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="partActive"
                    checked={partActive}
                    onChange={(e) => setPartActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 text-blue-600 bg-slate-950 focus:ring-0 font-mono"
                  />
                  <label htmlFor="partActive" className="text-slate-300 text-sm font-semibold cursor-pointer">
                    Active Catalog Reference (Un-checking soft-deletes the part)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-300 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPart}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-sm font-semibold disabled:opacity-50"
                >
                  {savingPart ? 'Saving...' : 'Save Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            <h3 className="text-xl font-bold text-slate-100 mb-2">Adjust Inventory Levels</h3>
            <p className="text-slate-500 text-xs mb-4">Item: <span className="text-slate-300 font-semibold">{adjustPartName}</span></p>

            {adjustError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2.5 text-slate-200 outline-none text-sm"
                  >
                    <option value="in">In (Restock / Add)</option>
                    <option value="out">Out (Loss / Discard)</option>
                    <option value="adjustment">Adjustment (Absolute Override)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Quantity</label>
                  <input
                    type="number"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Reason / Comments</label>
                <textarea
                  required
                  placeholder="e.g. Regular supplier restock, damaged packing box, stock audit override"
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-slate-200 outline-none transition text-sm resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-300 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdjustment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition text-sm font-semibold disabled:opacity-50"
                >
                  {savingAdjustment ? 'Saving...' : 'Apply adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
