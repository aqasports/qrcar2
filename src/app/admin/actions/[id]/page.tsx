'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { INTERVENTION_TEMPLATES, InterventionTemplate } from '@/lib/intervention-templates';

interface WorkerAssignment {
  assignment_id?: string;
  worker_id: string;
  role_on_job: 'lead' | 'assist';
  hours_spent?: number;
  full_name: string;
  worker_role?: string;
}

interface WorkerOption {
  id: string;
  full_name: string;
  role: string;
}

interface ServiceAction {
  id: string;
  vehicle_id: string;
  plate_number: string;
  make: string;
  model: string;
  year?: number;
  fuel_type?: string;
  engine_spec?: string;
  client_name: string;
  client_phone?: string;
  type: 'repair' | 'maintenance' | 'inspection' | 'other';
  description: string;
  client_visible_notes: string | null;
  internal_notes: string | null;
  mileage_at_service: number;
  status: 'open' | 'in_progress' | 'completed' | 'invoiced';
  date_in: string;
  date_out: string | null;
  labor_cost?: number;
}

interface PartUsed {
  item_id?: string;
  part_id: string;
  quantity: number;
  unit_price_snapshot?: number;
  name: string;
  sku: string;
  unit: string;
}

interface CatalogPartOption {
  id: string;
  name: string;
  sku: string;
  quantity_in_stock: number;
  sale_price: number;
  unit?: string;
}

interface ActionInvoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
}

export default function ActionDetailPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const params = useParams();
  const actionId = params.id as string;

  const [action, setAction] = useState<ServiceAction | null>(null);
  const [assignedWorkers, setAssignedWorkers] = useState<WorkerAssignment[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [allWorkers, setAllWorkers] = useState<WorkerOption[]>([]);
  const [catalogParts, setCatalogParts] = useState<CatalogPartOption[]>([]);
  const [invoice, setInvoice] = useState<ActionInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comprehensive Parameters Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceAction['type']>('maintenance');
  const [description, setDescription] = useState('');
  const [clientVisibleNotes, setClientVisibleNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [mileage, setMileage] = useState('');
  const [status, setStatus] = useState<ServiceAction['status']>('open');
  const [laborCost, setLaborCost] = useState('0.00');
  const [dateIn, setDateIn] = useState('');
  const [dateOut, setDateOut] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  // Worker assignment form states
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [roleOnJob, setRoleOnJob] = useState<'lead' | 'assist'>('lead');
  const [workerHours, setWorkerHours] = useState('0.0');
  const [workerAssignError, setWorkerAssignError] = useState('');
  const [savingWorkers, setSavingWorkers] = useState(false);

  // Parts attachment form states
  const [showPartAttachModal, setShowPartAttachModal] = useState(false);
  const [partToAttachId, setPartToAttachId] = useState('');
  const [attachQty, setAttachQty] = useState('1');
  const [partSearch, setPartSearch] = useState('');
  const [attachError, setAttachError] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);

  // Billing states
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [deletingAction, setDeletingAction] = useState(false);

  const fetchActionData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/actions/${actionId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de charger les détails de l\'intervention.');
      } else {
        setAction(data.action);
        setAssignedWorkers(data.workers || []);
        setPartsUsed(data.parts || []);
        setInvoice(data.invoice || null);

        // Sync editor form
        setServiceType(data.action.type);
        setDescription(data.action.description || '');
        setClientVisibleNotes(data.action.client_visible_notes || '');
        setInternalNotes(data.action.internal_notes || '');
        setMileage(data.action.mileage_at_service?.toString() || '0');
        setStatus(data.action.status);
        setLaborCost(data.action.labor_cost?.toString() || '0.00');
        setDateIn(data.action.date_in ? data.action.date_in.split('T')[0] : '');
        setDateOut(data.action.date_out ? data.action.date_out.split('T')[0] : '');
      }
    } catch (err) {
      setError('Échec de communication réseau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [wrkRes, prtRes] = await Promise.all([
        fetch('/api/workers'),
        fetch('/api/parts')
      ]);
      const wrkData = await wrkRes.json();
      const prtData = await prtRes.json();

      if (Array.isArray(wrkData)) {
        setAllWorkers(wrkData.filter((w: any) => w.active));
        if (wrkData.length > 0) setSelectedWorkerId(wrkData[0].id);
      }
      if (Array.isArray(prtData)) {
        setCatalogParts(prtData.filter((p: any) => p.active));
        if (prtData.length > 0) setPartToAttachId(prtData[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (actionId) {
      fetchActionData();
    }
  }, [actionId]);

  useEffect(() => {
    if (role && role !== 'technician') {
      fetchDependencies();
    }
  }, [role]);

  // Apply a template preset inside the editor
  const applyPresetTemplate = (tplId: string) => {
    const tpl = INTERVENTION_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setServiceType(tpl.default_type);
    if (tpl.description_placeholder) setDescription(tpl.description_placeholder);
    if (tpl.suggested_labor_cost > 0 && role !== 'technician') setLaborCost(tpl.suggested_labor_cost.toString());
    if (tpl.client_notes_template) setClientVisibleNotes(tpl.client_notes_template);
    if (tpl.internal_notes_template && role !== 'technician') setInternalNotes(tpl.internal_notes_template);
  };

  // Handle Complete Action Parameters Update
  const handleUpdateParameters = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');

    const payload: any = {
      type: serviceType,
      description: description.trim(),
      client_visible_notes: clientVisibleNotes.trim() || null,
      mileage_at_service: parseInt(mileage, 10) || 0,
      status,
      date_in: dateIn || undefined,
      date_out: dateOut || undefined,
    };

    if (role !== 'technician') {
      payload.internal_notes = internalNotes.trim() || null;
      payload.labor_cost = parseFloat(laborCost) || 0.00;
    }

    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || 'Erreur lors de la mise à jour des paramètres.');
      } else {
        setAction({ ...action!, ...data });
        setIsEditing(false);
        fetchActionData();
      }
    } catch (err) {
      setActionError('Erreur de transmission réseau.');
    } finally {
      setSaving(false);
    }
  };

  // Add Worker Assignment
  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || role === 'technician') return;
    setSavingWorkers(true);
    setWorkerAssignError('');

    const existing = assignedWorkers.map(w => ({
      worker_id: w.worker_id,
      role_on_job: w.role_on_job,
      hours_spent: w.hours_spent || 0.0
    }));

    if (existing.some(w => w.worker_id === selectedWorkerId)) {
      setWorkerAssignError('Ce technicien est déjà affecté à cette intervention.');
      setSavingWorkers(false);
      return;
    }

    const updated = [
      ...existing,
      { worker_id: selectedWorkerId, role_on_job: roleOnJob, hours_spent: parseFloat(workerHours) || 0.0 }
    ];

    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workers: updated }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWorkerAssignError(data.error || 'Impossible d\'affecter le technicien.');
      } else {
        setShowWorkerModal(false);
        setWorkerHours('0.0');
        fetchActionData();
      }
    } catch (err) {
      setWorkerAssignError('Erreur de connexion.');
    } finally {
      setSavingWorkers(false);
    }
  };

  // Remove Worker Assignment
  const handleRemoveWorker = async (workerIdToRemove: string) => {
    if (role === 'technician') return;
    if (!confirm('Voulez-vous retirer ce technicien de l\'intervention ?')) return;

    const updatedList = assignedWorkers
      .filter(w => w.worker_id !== workerIdToRemove)
      .map(w => ({ worker_id: w.worker_id, role_on_job: w.role_on_job, hours_spent: w.hours_spent || 0.0 }));

    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workers: updatedList }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Impossible de retirer le technicien.');
      } else {
        fetchActionData();
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // Attach Part from Live Stock
  const handleAttachPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partToAttachId) return;
    setIsAttaching(true);
    setAttachError('');

    const qty = parseInt(attachQty, 10);
    if (isNaN(qty) || qty <= 0) {
      setAttachError('Veuillez spécifier une quantité supérieure à 0.');
      setIsAttaching(false);
      return;
    }

    try {
      const res = await fetch(`/api/actions/${actionId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_id: partToAttachId, quantity: qty }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAttachError(data.error || 'Erreur lors de l\'ajout de la pièce.');
      } else {
        setShowPartAttachModal(false);
        setAttachQty('1');
        fetchActionData();
        fetchDependencies();
      }
    } catch (err) {
      setAttachError('Erreur de transmission.');
    } finally {
      setIsAttaching(false);
    }
  };

  // Remove Part (Restores Inventory)
  const handleRemovePart = async (partId: string, partName: string) => {
    if (!confirm(`Voulez-vous retirer "${partName}" de cette intervention ? La quantité sera automatiquement réintégrée au stock.`)) return;

    try {
      const res = await fetch(`/api/actions/${actionId}/parts/${partId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Impossible de retirer la pièce.');
      } else {
        fetchActionData();
        fetchDependencies();
      }
    } catch (err) {
      alert('Erreur de connexion.');
    }
  };

  // Generate / Issue Invoice
  const handleGenerateInvoice = async () => {
    if (role === 'technician') return;
    setGeneratingInvoice(true);
    setInvoiceError('');

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInvoiceError(data.error || 'Impossible de générer la facture.');
      } else {
        fetchActionData();
      }
    } catch (err) {
      setInvoiceError('Erreur de communication.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Delete Action entirely
  const handleDeleteAction = async () => {
    if (role === 'technician') return;
    if (!confirm('ATTENTION: Voulez-vous supprimer définitivement cette intervention ? Les pièces consommées seront réintégrées au stock.')) return;

    setDeletingAction(true);
    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Impossible de supprimer cette intervention.');
        setDeletingAction(false);
      } else {
        router.push('/admin/actions');
      }
    } catch (err) {
      alert('Erreur réseau lors de la suppression.');
      setDeletingAction(false);
    }
  };

  // Compute Cost Subtotals
  const partsSubtotal = partsUsed.reduce((acc, p) => acc + (p.unit_price_snapshot || 0) * p.quantity, 0);
  const laborTotal = action?.labor_cost || 0;
  const grandTotal = partsSubtotal + laborTotal;

  // Filter Catalog Parts
  const filteredCatalogParts = catalogParts.filter(
    (p) => p.name.toLowerCase().includes(partSearch.toLowerCase()) || p.sku.toLowerCase().includes(partSearch.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement du dossier d&apos;intervention...</div>;
  if (error || !action) return <div className="p-8 text-center text-red-400">{error || 'Intervention introuvable'}</div>;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/actions" className="text-slate-400 hover:text-slate-200 text-xs font-bold transition">
            &larr; Toutes les Interventions
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-mono text-xs font-bold">{action.plate_number}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10 active:scale-[0.98]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Modifier les Paramètres
            </button>
          )}

          {role !== 'technician' && !invoice && (
            <button
              onClick={handleDeleteAction}
              disabled={deletingAction}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold transition disabled:opacity-50"
            >
              {deletingAction ? 'Suppression...' : 'Supprimer'}
            </button>
          )}
        </div>
      </div>

      {/* Main Parameters Editor Form (When in Edit Mode) */}
      {isEditing ? (
        <div className="bg-slate-900 border border-blue-500/30 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Éditeur Intégral des Paramètres d&apos;Intervention</h3>
              <p className="text-xs text-slate-400 mt-0.5">Modifiez n&apos;importe quel paramètre technique, financier ou temporel de cette opération.</p>
            </div>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-200 text-xs font-bold">
              Annuler
            </button>
          </div>

          {actionError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {actionError}
            </div>
          )}

          {/* Quick Presets Bar */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Charger un Modèle Métier Prédéfini
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INTERVENTION_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyPresetTemplate(tpl.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-blue-300 transition"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleUpdateParameters} className="space-y-6">
            {/* Row 1: Type, Statut & Kilométrage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Type d&apos;Intervention *</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none transition capitalize"
                >
                  <option value="maintenance">Entretien Périodique / Vidange</option>
                  <option value="repair">Réparation Mécanique / Moteur</option>
                  <option value="inspection">Diagnostic & Contrôle Technique</option>
                  <option value="other">Freinage, Liaisons & Pneumatiques</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Statut de Réalisation *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none transition"
                >
                  <option value="open">Ouverte (En attente)</option>
                  <option value="in_progress">En Cours de Réalisation</option>
                  <option value="completed">Terminée (Prête pour Facturation)</option>
                  <option value="invoiced">Facturée (Verrouillée)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Kilométrage Compteur (km) *</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  required
                  min="0"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 font-mono text-sm outline-none transition"
                />
              </div>
            </div>

            {/* Row 2: Dates & Coût Main d'Œuvre */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-850">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Date de Réception</label>
                <input
                  type="date"
                  value={dateIn}
                  onChange={(e) => setDateIn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Date de Restitution</label>
                <input
                  type="date"
                  value={dateOut}
                  onChange={(e) => setDateOut(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none transition"
                />
              </div>

              {role !== 'technician' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Coût Main d&apos;Œuvre (HT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 font-mono text-sm outline-none transition"
                  />
                </div>
              )}
            </div>

            {/* Row 3: Description */}
            <div className="pt-2 border-t border-slate-850">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Description des Travaux Effectués *</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none transition resize-none"
              />
            </div>

            {/* Row 4: Notes Client & Internes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-850">
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1.5">
                  Notes Visibles Client (Carnet Numérique QR)
                </label>
                <textarea
                  rows={3}
                  placeholder="Conseils d'entretien, pièces remplacées à surveiller, recommandations..."
                  value={clientVisibleNotes}
                  onChange={(e) => setClientVisibleNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none transition resize-none"
                />
              </div>

              {role !== 'technician' && (
                <div>
                  <label className="block text-xs font-bold text-amber-400 mb-1.5">
                    Notes Internes Atelier (Confidentielles)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Historique des démontages, références pièces privées, temps effectif..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none transition resize-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-xs font-bold transition shadow-md shadow-blue-500/10 disabled:opacity-50"
              >
                {saving ? 'Enregistrement des modifications...' : 'Valider & Appliquer les Modifications'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-5 rounded-xl text-xs font-bold transition"
              >
                Fermer l&apos;Éditeur
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Action Header Summary Card */
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                  action.status === 'completed' || action.status === 'invoiced'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                    : action.status === 'in_progress'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                }`}>
                  {action.status}
                </span>
                <span className="text-xs uppercase font-bold text-slate-400 font-mono tracking-wider">
                  Type: {action.type}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">{action.description}</h2>
            </div>

            <div className="text-right">
              <span className="text-slate-500 text-xs block">Date d&apos;entrée :</span>
              <span className="text-slate-300 font-medium text-xs">
                {new Date(action.date_in).toLocaleDateString()}
              </span>
              {action.date_out && (
                <div className="mt-1">
                  <span className="text-slate-500 text-xs block">Restitution :</span>
                  <span className="text-slate-300 font-medium text-xs">
                    {new Date(action.date_out).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Véhicule</span>
              <Link href={`/admin/vehicles/${action.vehicle_id}`} className="text-sm font-bold text-slate-200 hover:text-blue-400 block mt-0.5 truncate">
                {action.make} {action.model}
              </Link>
              <span className="text-xs font-mono text-slate-400 block">{action.plate_number}</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Kilométrage Relevé</span>
              <span className="text-base font-bold font-mono text-slate-100 block mt-0.5">
                {action.mileage_at_service.toLocaleString()} km
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Titulaire Client</span>
              <span className="text-sm font-bold text-slate-200 block mt-0.5 truncate">{action.client_name}</span>
              {action.client_phone && (
                <span className="text-xs font-mono text-slate-400 block">{action.client_phone}</span>
              )}
            </div>

            {role !== 'technician' && (
              <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Main d&apos;Œuvre (HT)</span>
                <span className="text-base font-bold font-mono text-blue-400 block mt-0.5">
                  {(action.labor_cost || 0).toFixed(2)} DZD
                </span>
              </div>
            )}
          </div>

          {/* Notes display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Notes Visibles sur le Carnet Client (QR)
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">
                {action.client_visible_notes || 'Aucune note publique ajoutée.'}
              </p>
            </div>

            {role !== 'technician' && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Notes Internes Confidentielles
                </span>
                <p className="text-xs text-slate-400 whitespace-pre-wrap">
                  {action.internal_notes || 'Aucune note interne.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: Technicians & Parts Used Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Technicians & Staff Assignment Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Personnel & Techniciens Affectés</h3>
              <p className="text-xs text-slate-500">Mécaniciens et assistants assignés à cette tâche</p>
            </div>

            {role !== 'technician' && (
              <button
                onClick={() => {
                  setWorkerAssignError('');
                  setShowWorkerModal(true);
                }}
                className="text-xs font-bold text-blue-400 hover:text-blue-300"
              >
                + Affecter un Technicien
              </button>
            )}
          </div>

          {assignedWorkers.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500">Aucun technicien n&apos;est encore assigné à cette intervention.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {assignedWorkers.map((w) => (
                <div key={w.worker_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                      {w.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{w.full_name}</h4>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Rôle : {w.role_on_job === 'lead' ? 'Chef d\'équipe / Responsable' : 'Assistant mécanicien'}
                        {w.hours_spent ? ` • ${w.hours_spent}h` : ''}
                      </span>
                    </div>
                  </div>

                  {role !== 'technician' && (
                    <button
                      onClick={() => handleRemoveWorker(w.worker_id)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold p-1"
                      title="Retirer le technicien"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Parts & Stock Consumption Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100">Pièces Consommées & Fournitures</h3>
              <p className="text-xs text-slate-500">Déduction atomique du stock magasin</p>
            </div>

            <button
              onClick={() => {
                setAttachError('');
                setShowPartAttachModal(true);
              }}
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              + Ajouter une Pièce
            </button>
          </div>

          {partsUsed.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500">Aucune pièce détachée n&apos;a été consommée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {partsUsed.map((p) => (
                <div key={p.part_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-850">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{p.name}</h4>
                    <span className="text-xs font-mono text-slate-400">
                      SKU: {p.sku} • Qté: <strong>{p.quantity} {p.unit}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {role !== 'technician' && p.unit_price_snapshot !== undefined && (
                      <span className="text-xs font-mono text-blue-400 font-bold">
                        {(p.unit_price_snapshot * p.quantity).toFixed(2)} DZD
                      </span>
                    )}
                    <button
                      onClick={() => handleRemovePart(p.part_id, p.name)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold p-1"
                      title="Retirer la pièce et réintégrer au stock"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoicing & Billing Summary Center */}
      {role !== 'technician' && (
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Facturation & Décompte Financier</h3>
              <p className="text-xs text-slate-400 mt-0.5">Calcul automatique du devis et édition de la facture finale</p>
            </div>

            {invoice ? (
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  Facture {invoice.invoice_number} ({invoice.status})
                </span>
                <Link
                  href={`/api/invoices/${invoice.id}/download`}
                  target="_blank"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  Télécharger PDF Facture
                </Link>
              </div>
            ) : (
              <button
                onClick={handleGenerateInvoice}
                disabled={generatingInvoice}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/10 disabled:opacity-50"
              >
                {generatingInvoice ? 'Génération de la facture...' : 'Émettre la Facture Officielle'}
              </button>
            )}
          </div>

          {invoiceError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {invoiceError}
            </div>
          )}

          {/* Breakdown Table */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-850">
              <span className="text-xs text-slate-500 uppercase font-bold">Total Pièces & Fournitures</span>
              <span className="text-lg font-bold font-mono text-slate-200 block mt-1">
                {partsSubtotal.toFixed(2)} DZD
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-850">
              <span className="text-xs text-slate-500 uppercase font-bold">Total Main d&apos;Œuvre</span>
              <span className="text-lg font-bold font-mono text-slate-200 block mt-1">
                {laborTotal.toFixed(2)} DZD
              </span>
            </div>

            <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20">
              <span className="text-xs text-blue-400 uppercase font-bold">Montant Total Brut (HT)</span>
              <span className="text-xl font-extrabold font-mono text-blue-400 block mt-1">
                {grandTotal.toFixed(2)} DZD
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Worker Assignment */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Affecter un Technicien</h3>

            {workerAssignError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {workerAssignError}
              </div>
            )}

            <form onSubmit={handleAddWorker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Technicien *</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none"
                  required
                >
                  {allWorkers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.full_name} ({w.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Rôle sur la tâche</label>
                  <select
                    value={roleOnJob}
                    onChange={(e) => setRoleOnJob(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none"
                  >
                    <option value="lead">Chef d&apos;équipe / Référent</option>
                    <option value="assist">Assistant mécanicien</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Heures passées</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={workerHours}
                    onChange={(e) => setWorkerHours(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 font-mono text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingWorkers}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-50"
                >
                  {savingWorkers ? 'Affectation...' : 'Confirmer l\'affectation'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWorkerModal(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 rounded-xl text-xs font-bold transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Inventory Part */}
      {showPartAttachModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Ajouter une Pièce du Magasin</h3>

            {attachError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {attachError}
              </div>
            )}

            <form onSubmit={handleAttachPart} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Rechercher une pièce</label>
                <input
                  type="text"
                  placeholder="Filtrer par nom ou SKU..."
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none mb-2"
                />

                <select
                  value={partToAttachId}
                  onChange={(e) => setPartToAttachId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none"
                  required
                >
                  {filteredCatalogParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.quantity_in_stock} {p.unit || 'pcs'}) — {p.sale_price.toFixed(2)} DZD
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Quantité à consommer</label>
                <input
                  type="number"
                  min="1"
                  value={attachQty}
                  onChange={(e) => setAttachQty(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-slate-200 font-mono text-sm outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isAttaching}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2.5 text-xs font-bold transition disabled:opacity-50"
                >
                  {isAttaching ? 'Déduction du stock...' : 'Ajouter & Déduire du Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPartAttachModal(false)}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 rounded-xl text-xs font-bold transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
