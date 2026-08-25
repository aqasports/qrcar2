'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner, Button } from '@/components/ui';
import { ActionHeader } from '@/components/actions/ActionHeader';
import { ActionDetailsCard, ActionDetailData } from '@/components/actions/ActionDetailsCard';
import { ActionPartsTable, PartUsed } from '@/components/actions/ActionPartsTable';
import { ActionWorkersCard, WorkerAssignment } from '@/components/actions/ActionWorkersCard';
import { ActionCostSummary, InvoiceSummary } from '@/components/actions/ActionCostSummary';
import { AttachPartModal, CatalogPartOption } from '@/components/actions/AttachPartModal';
import { AssignWorkerModal, WorkerOption } from '@/components/actions/AssignWorkerModal';

export default function ActionDetailPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const router = useRouter();
  const params = useParams();
  const actionId = params.id as string;

  const [action, setAction] = useState<ActionDetailData | null>(null);
  const [assignedWorkers, setAssignedWorkers] = useState<WorkerAssignment[]>([]);
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [allWorkers, setAllWorkers] = useState<WorkerOption[]>([]);
  const [catalogParts, setCatalogParts] = useState<CatalogPartOption[]>([]);
  const [invoice, setInvoice] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [serviceType, setServiceType] = useState('maintenance');
  const [description, setDescription] = useState('');
  const [clientVisibleNotes, setClientVisibleNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [mileage, setMileage] = useState('');
  const [status, setStatus] = useState('open');
  const [laborCost, setLaborCost] = useState('0.00');
  const [dateIn, setDateIn] = useState('');
  const [dateOut, setDateOut] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  // Worker assignment modal
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [roleOnJob, setRoleOnJob] = useState<'lead' | 'assist'>('lead');
  const [workerHours, setWorkerHours] = useState('0.0');
  const [workerAssignError, setWorkerAssignError] = useState('');
  const [savingWorkers, setSavingWorkers] = useState(false);

  // Part attach modal
  const [showPartAttachModal, setShowPartAttachModal] = useState(false);
  const [partToAttachId, setPartToAttachId] = useState('');
  const [attachQty, setAttachQty] = useState('1');
  const [attachError, setAttachError] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);

  // Billing
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const fetchActionData = useCallback(async () => {
    try {
      const res = await fetch(`/api/actions/${actionId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de charger l\'intervention.');
      } else {
        setAction(data.action);
        setAssignedWorkers(data.workers || []);
        setPartsUsed(data.parts || []);
        setInvoice(data.invoice || null);

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
      console.error(err);
      setError('Échec de communication réseau.');
    } finally {
      setLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const res = await fetch(`/api/actions/${actionId}`);
        const data = await res.json();
        if (!isMounted) return;
        if (!res.ok) {
          setError(data.error || 'Impossible de charger l\'intervention.');
        } else {
          setAction(data.action);
          setAssignedWorkers(data.workers || []);
          setPartsUsed(data.parts || []);
          setInvoice(data.invoice || null);

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
        console.error(err);
        if (isMounted) setError('Échec de communication réseau.');
      } finally {
        if (isMounted) setLoading(false);
      }

      if (role && role !== 'technician') {
        try {
          const [wRes, pRes] = await Promise.all([
            fetch('/api/workers'),
            fetch('/api/parts'),
          ]);
          const wData = await wRes.json();
          const pData = await pRes.json();
          if (isMounted && Array.isArray(wData)) setAllWorkers(wData.filter((w: WorkerOption) => w.active));
          if (isMounted && Array.isArray(pData)) setCatalogParts(pData);
        } catch (err) {
          console.error(err);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [actionId, role]);

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionError('');

    try {
      const res = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: serviceType,
          description,
          client_visible_notes: clientVisibleNotes || null,
          internal_notes: internalNotes || null,
          mileage_at_service: parseInt(mileage, 10) || 0,
          status,
          labor_cost: parseFloat(laborCost) || 0,
          date_in: dateIn,
          date_out: dateOut || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Erreur lors de la mise à jour');
      } else {
        setAction(data.action);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      setActionError('Erreur de communication.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) return;
    setSavingWorkers(true);
    setWorkerAssignError('');

    try {
      const res = await fetch(`/api/actions/${actionId}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: selectedWorkerId,
          role_on_job: roleOnJob,
          hours_spent: parseFloat(workerHours) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWorkerAssignError(data.error || 'Erreur lors de l’assignation');
      } else {
        setShowWorkerModal(false);
        fetchActionData();
      }
    } catch (err) {
      console.error(err);
      setWorkerAssignError('Erreur réseau.');
    } finally {
      setSavingWorkers(false);
    }
  };

  const handleRemoveWorker = async (workerId: string) => {
    try {
      const res = await fetch(`/api/actions/${actionId}/workers/${workerId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchActionData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partToAttachId) return;
    setIsAttaching(true);
    setAttachError('');

    try {
      const res = await fetch(`/api/actions/${actionId}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_id: partToAttachId,
          quantity: parseInt(attachQty, 10) || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAttachError(data.error || 'Erreur lors de l’ajout de la pièce');
      } else {
        setShowPartAttachModal(false);
        fetchActionData();
      }
    } catch (err) {
      console.error(err);
      setAttachError('Erreur réseau.');
    } finally {
      setIsAttaching(false);
    }
  };

  const handleRemovePart = async (partId: string) => {
    try {
      const res = await fetch(`/api/actions/${actionId}/parts/${partId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchActionData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true);
    try {
      const res = await fetch(`/api/actions/${actionId}/invoice`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchActionData();
        router.push(`/admin/invoices`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!confirm('Supprimer définitivement cet ordre de réparation ?')) return;
    try {
      const res = await fetch(`/api/actions/${actionId}`, { method: 'DELETE' });
      if (res.ok) router.push('/admin/actions');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-text-muted font-medium">Chargement de l&apos;intervention...</p>
      </div>
    );
  }

  if (error || !action) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4">
        <p className="text-sm text-danger font-bold">{error || 'Intervention introuvable'}</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/admin/actions')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <ActionHeader
        action={action}
        invoice={invoice}
        onGenerateInvoice={handleGenerateInvoice}
        onDeleteAction={handleDeleteAction}
        generatingInvoice={generatingInvoice}
        role={role}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Parts */}
        <div className="space-y-6 lg:col-span-2">
          <ActionDetailsCard
            action={action}
            isEditing={isEditing}
            onStartEdit={() => setIsEditing(true)}
            onCancelEdit={() => setIsEditing(false)}
            onSave={handleSaveAction}
            saving={saving}
            role={role}
            formState={{
              serviceType,
              setServiceType,
              description,
              setDescription,
              clientVisibleNotes,
              setClientVisibleNotes,
              internalNotes,
              setInternalNotes,
              mileage,
              setMileage,
              status,
              setStatus,
              laborCost,
              setLaborCost,
              dateIn,
              setDateIn,
              dateOut,
              setDateOut,
              actionError,
            }}
          />

          <ActionPartsTable
            partsUsed={partsUsed}
            onOpenAttachModal={() => {
              setAttachError('');
              setShowPartAttachModal(true);
            }}
            onRemovePart={handleRemovePart}
            role={role}
          />
        </div>

        {/* Right 1 Col: Workers & Financials */}
        <div className="space-y-6 lg:col-span-1">
          <ActionCostSummary
            laborCost={parseFloat(laborCost) || 0}
            partsUsed={partsUsed}
            invoice={invoice}
          />

          <ActionWorkersCard
            assignedWorkers={assignedWorkers}
            onOpenAssignModal={() => {
              setWorkerAssignError('');
              setShowWorkerModal(true);
            }}
            onRemoveWorker={handleRemoveWorker}
            role={role}
          />
        </div>
      </div>

      {/* Modals */}
      <AttachPartModal
        isOpen={showPartAttachModal}
        onClose={() => setShowPartAttachModal(false)}
        catalogParts={catalogParts}
        onAttachPart={handleAttachPart}
        isAttaching={isAttaching}
        attachError={attachError}
        partToAttachId={partToAttachId}
        setPartToAttachId={setPartToAttachId}
        attachQty={attachQty}
        setAttachQty={setAttachQty}
      />

      <AssignWorkerModal
        isOpen={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
        workers={allWorkers}
        onAssignWorker={handleAssignWorker}
        isSaving={savingWorkers}
        error={workerAssignError}
        selectedWorkerId={selectedWorkerId}
        setSelectedWorkerId={setSelectedWorkerId}
        roleOnJob={roleOnJob}
        setRoleOnJob={setRoleOnJob}
        hours={workerHours}
        setHours={setWorkerHours}
      />
    </div>
  );
}
