'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Spinner,
  ConfirmDialog,
  CurrencyDisplay,
} from '@/components/ui';
import { RepairOrderLineItems, RepairOrderLineItem, CatalogPartOption } from '@/components/repair-order/RepairOrderLineItems';
import { CostBreakdownBar } from '@/components/repair-order/CostBreakdownBar';
import { TorqueSpecsPanel } from '@/components/repair-order/TorqueSpecsPanel';
import { VehicleLookupPanel } from '@/components/repair-order/VehicleLookupPanel';
import { ActionHeader } from '@/components/actions/ActionHeader';
import { AssignWorkerModal, WorkerOption } from '@/components/actions/AssignWorkerModal';
import { RepairQualityCheckpoints, QualityCheckpointItem } from '@/components/repair-order/RepairQualityCheckpoints';
import { ActionLaborTimer } from '@/components/repair-order/ActionLaborTimer';

export default function ActionDetailPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const params = useParams();
  const actionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<any | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [lineItems, setLineItems] = useState<RepairOrderLineItem[]>([]);
  const [catalogParts, setCatalogParts] = useState<CatalogPartOption[]>([]);
  const [allWorkers, setAllWorkers] = useState<WorkerOption[]>([]);
  const [invoice, setInvoice] = useState<any | null>(null);

  // Status & Edit State
  const [status, setStatus] = useState<string>('open');
  const [description, setDescription] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [mileage, setMileage] = useState('0');
  const [laborCost, setLaborCost] = useState(0);
  const [hasTax, setHasTax] = useState(true);
  const [taxRate, setTaxRate] = useState(19.0);
  const [qualityCheckpoints, setQualityCheckpoints] = useState<QualityCheckpointItem[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Worker Modal
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerRole, setWorkerRole] = useState<'lead' | 'assist'>('lead');
  const [workerHours, setWorkerHours] = useState('1.5');
  const [savingWorker, setSavingWorker] = useState(false);
  const [workerError, setWorkerError] = useState('');

  const fetchAction = useCallback(async () => {
    try {
      const res = await fetch(`/api/actions/${actionId}`);
      const data = await res.json();
      if (!res.ok || !data.data?.action) {
        setError(data.error || 'Impossible de charger l’ordre de réparation.');
      } else {
        const act = data.data.action;
        setAction(act);
        setWorkers(data.data.workers || []);
        setLineItems(data.data.items || []);
        setInvoice(data.data.invoice || null);

        setStatus(act.status || 'open');
        setDescription(act.description || '');
        setClientNotes(act.client_visible_notes || '');
        setInternalNotes(act.internal_notes || '');
        setMileage(String(act.mileage_at_service || '0'));
        setLaborCost(parseFloat(act.labor_cost || '0'));
        setHasTax(act.has_tax !== false && act.has_tax !== 0);
        setTaxRate(parseFloat(act.tax_rate || '19.00'));

        if (act.quality_checkpoints) {
          try {
            const parsed =
              typeof act.quality_checkpoints === 'string'
                ? JSON.parse(act.quality_checkpoints)
                : act.quality_checkpoints;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setQualityCheckpoints(parsed);
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erreur réseau lors du chargement.');
    } finally {
      setLoading(false);
    }
  }, [actionId]);

  const handleCheckpointsChange = async (updated: QualityCheckpointItem[]) => {
    setQualityCheckpoints(updated);
    try {
      await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality_checkpoints: updated }),
      });
    } catch (err) {
      console.error('Failed to sync quality checkpoints:', err);
    }
  };

  useEffect(() => {
    fetchAction();

    if (role !== 'technician') {
      Promise.all([fetch('/api/parts'), fetch('/api/workers')])
        .then(async ([pRes, wRes]) => {
          const pData = await pRes.json();
          const wData = await wRes.json();
          const rawP = pData?.data !== undefined ? pData.data : pData;
          const rawW = wData?.data !== undefined ? wData.data : wData;
          if (Array.isArray(rawP)) setCatalogParts(rawP);
          if (Array.isArray(rawW)) setAllWorkers(rawW.filter((w: WorkerOption) => w.active !== false));
        })
        .catch(console.error);
    }
  }, [fetchAction, role]);

  // Line Item Handlers (with live server sync)
  const handleUpdateLineItem = async (itemId: string, updates: Partial<RepairOrderLineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );

    try {
      await fetch(`/api/actions/${actionId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error('Failed to sync item update:', err);
    }
  };

  const handleRemoveLineItem = async (itemId: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== itemId));

    try {
      await fetch(`/api/actions/${actionId}/items/${itemId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete item:', err);
      fetchAction();
    }
  };

  const handleAddLineItem = async (item: Omit<RepairOrderLineItem, 'id'>) => {
    try {
      const res = await fetch(`/api/actions/${actionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        fetchAction();
      }
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          client_visible_notes: clientNotes || null,
          internal_notes: internalNotes || null,
          mileage_at_service: parseInt(mileage, 10) || 0,
          status,
          labor_cost: laborCost,
          has_tax: hasTax,
          tax_rate: hasTax ? taxRate : 0.0,
        }),
      });
      if (res.ok) {
        fetchAction();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAction();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) return;
    setSavingWorker(true);
    setWorkerError('');

    try {
      const newWorkers = [
        ...workers.map((w) => ({
          worker_id: w.worker_id,
          role_on_job: w.role_on_job,
          hours_spent: parseFloat(w.hours_spent) || 0,
        })),
        {
          worker_id: selectedWorkerId,
          role_on_job: workerRole,
          hours_spent: parseFloat(workerHours) || 0,
        },
      ];

      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workers: newWorkers }),
      });

      if (!res.ok) {
        setWorkerError('Erreur lors de l’assignation du travailleur.');
      } else {
        setShowWorkerModal(false);
        fetchAction();
      }
    } catch (err) {
      console.error(err);
      setWorkerError('Erreur réseau.');
    } finally {
      setSavingWorker(false);
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    const updated = workers
      .filter((w) => w.worker_id !== workerId)
      .map((w) => ({
        worker_id: w.worker_id,
        role_on_job: w.role_on_job,
        hours_spent: parseFloat(w.hours_spent) || 0,
      }));

    try {
      await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workers: updated }),
      });
      fetchAction();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId }),
      });
      if (res.ok) {
        router.push('/admin/invoices');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!confirm('Supprimer définitivement cet ordre de réparation et réajuster les stocks ?')) return;
    try {
      const res = await fetch(`/api/actions/${actionId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/actions');
    } catch (err) {
      console.error(err);
    }
  };

  // Subtotals
  const servicesSubtotal = lineItems
    .filter((i) => i.item_type !== 'part')
    .reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

  const partsSubtotal = lineItems
    .filter((i) => i.item_type === 'part')
    .reduce((acc, i) => acc + i.quantity * i.unit_price, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted">Chargement de l'ordre de réparation...</p>
      </div>
    );
  }

  if (error || !action) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4 font-sans">
        <p className="text-sm text-danger font-bold">{error || 'Ordre de réparation introuvable'}</p>
        <Link href="/admin/actions">
          <Button variant="secondary" size="sm">
            ← Retour à la liste
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 font-sans">
      {/* Header */}
      <ActionHeader
        action={action}
        invoice={invoice}
        onGenerateInvoice={handleGenerateInvoice}
        onDeleteAction={handleDeleteAction}
        generatingInvoice={generatingInvoice}
        role={role}
      />

      {/* Status Progression Bar */}
      <Card className="p-4 bg-surface-raised border border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Statut Atelier :
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { key: 'open', label: 'Ouvert / En Attente', color: 'neutral' },
              { key: 'in_progress', label: 'Travaux en cours', color: 'info' },
              { key: 'completed', label: 'Terminé', color: 'success' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => handleStatusChange(st.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  status === st.key
                    ? 'bg-accent text-white shadow-sm ring-1 ring-accent'
                    : 'bg-surface-base text-text-secondary hover:bg-surface-hover border border-border-subtle'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {invoice ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted font-mono">Facture N° {invoice.invoice_number}</span>
            <Badge variant="success">Facturé</Badge>
          </div>
        ) : (
          <Button
            variant="primary"
            size="xs"
            onClick={handleGenerateInvoice}
            isLoading={generatingInvoice}
            leftIcon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Émettre la Facture
          </Button>
        )}
      </Card>

      {/* Vehicle Info & Instant VIN Lookup */}
      <VehicleLookupPanel
        vehicle={{
          id: action.vehicle_id,
          plate_number: action.plate_number,
          make: action.make,
          model: action.model,
          year: action.year,
          vin: action.vin,
          current_mileage: action.mileage_at_service,
          fuel_type: action.fuel_type,
          engine_spec: action.engine_spec,
          oil_type: action.oil_type,
          tire_size: action.tire_size,
          client_name: action.client_name,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Acts, Parts & Technical Notes */}
        <div className="space-y-6 lg:col-span-2">
          {/* Interactive Line Items (Services & Parts) */}
          <RepairOrderLineItems
            items={lineItems}
            onUpdateItem={handleUpdateLineItem}
            onRemoveItem={handleRemoveLineItem}
            onAddItem={handleAddLineItem}
            catalogParts={catalogParts}
            currency="DZD"
            readOnly={role === 'technician' || action.status === 'invoiced'}
          />

          {/* Torque Specifications Reference */}
          <TorqueSpecsPanel
            vehicleMake={action.make}
            vehicleModel={action.model}
            engineCode={action.engine_spec}
            initialCollapsed={false}
          />

          {/* Description & Dual Notes Card */}
          <Card className="p-5 space-y-4 border border-border-default">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Détails & Notes de l'Intervention
              </h3>
              {role !== 'technician' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={handleSaveDetails}
                  isLoading={savingDetails}
                >
                  Enregistrer les notes
                </Button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                Désignation des Travaux
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={role === 'technician'}
                className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle">
              {/* Client Notes */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Notes Visibles Client (QR)</span>
                </label>
                <textarea
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  rows={3}
                  disabled={role === 'technician'}
                  placeholder="Conseils et préconisations..."
                  className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none disabled:opacity-60"
                />
              </div>

              {/* Internal Notes */}
              {role !== 'technician' && (
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <span>Notes Internes Atelier</span>
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    placeholder="Observations techniques confidentielles..."
                    className="w-full px-3 py-2 bg-surface-base border border-border-default rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Quality Checkpoints & Inspection Panel */}
          <RepairQualityCheckpoints
            checkpoints={qualityCheckpoints}
            onChange={handleCheckpointsChange}
          />
        </div>

        {/* Right 1 Col: Financials & Personnel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Active Job Punch-Clock & Labor Stopwatch */}
          <ActionLaborTimer
            actionId={actionId}
            hourlyRateDzd={2500}
            onHoursUpdate={(h) => {
              const computedLabor = Math.round(h * 2500);
              if (computedLabor > 0 && role !== 'technician') {
                setLaborCost(computedLabor);
                fetch(`/api/actions/${actionId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ labor_cost: computedLabor }),
                }).catch(console.error);
              }
            }}
          />

          {/* Real-time Financial Breakdown & Tax Switcher */}
          {role !== 'technician' && (
            <CostBreakdownBar
              servicesSubtotal={servicesSubtotal}
              partsSubtotal={partsSubtotal}
              laborCost={laborCost}
              onLaborChange={(val) => {
                setLaborCost(val);
                fetch(`/api/actions/${actionId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ labor_cost: val }),
                }).catch(console.error);
              }}
              hasTax={hasTax}
              onHasTaxChange={(val) => {
                setHasTax(val);
                fetch(`/api/actions/${actionId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ has_tax: val }),
                }).catch(console.error);
              }}
              taxRate={taxRate}
              onTaxRateChange={(val) => {
                setTaxRate(val);
                fetch(`/api/actions/${actionId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tax_rate: val }),
                }).catch(console.error);
              }}
              currency="DZD"
            />
          )}

          {/* Assigned Technicians Card */}
          <Card className="p-5 space-y-4 border border-border-default font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Personnel Affecté ({workers.length})
              </h3>
              {role !== 'technician' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={() => setShowWorkerModal(true)}
                >
                  + Affecter
                </Button>
              )}
            </div>

            {workers.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                Aucun mécanicien assigné pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {workers.map((w) => (
                  <div
                    key={w.worker_id}
                    className="p-2.5 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-xs text-text-primary block">
                        {w.full_name}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {w.role_on_job === 'lead' ? 'Chef de poste' : 'Assistant'} • {w.worker_role}
                      </span>
                    </div>

                    {role !== 'technician' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveWorker(w.worker_id)}
                        className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10"
                        title="Retirer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Worker Assign Modal */}
      <AssignWorkerModal
        isOpen={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        workers={allWorkers}
        onAssignWorker={handleAssignWorker}
        isSaving={savingWorker}
        error={workerError}
        selectedWorkerId={selectedWorkerId}
        setSelectedWorkerId={setSelectedWorkerId}
        roleOnJob={workerRole}
        setRoleOnJob={setWorkerRole}
        hours={workerHours}
        setHours={setWorkerHours}
      />
    </div>
  );
}
