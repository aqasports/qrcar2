import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea } from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface ActionDetailData {
  id: string;
  type: string;
  description: string;
  client_visible_notes?: string;
  internal_notes?: string;
  mileage_at_service: number;
  status: string;
  labor_cost: number;
  date_in: string;
  date_out?: string;
  vehicle_id: string;
  plate_number?: string;
  make?: string;
  model?: string;
  client_name?: string;
}

interface ActionDetailsCardProps {
  action: ActionDetailData;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  formState: {
    serviceType: string;
    setServiceType: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    clientVisibleNotes: string;
    setClientVisibleNotes: (v: string) => void;
    internalNotes: string;
    setInternalNotes: (v: string) => void;
    mileage: string;
    setMileage: (v: string) => void;
    status: string;
    setStatus: (v: string) => void;
    laborCost: string;
    setLaborCost: (v: string) => void;
    dateIn: string;
    setDateIn: (v: string) => void;
    dateOut: string;
    setDateOut: (v: string) => void;
    actionError: string;
  };
  role?: string;
}

export function ActionDetailsCard({
  action,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSave,
  saving,
  formState,
  role,
}: ActionDetailsCardProps) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.actions.title}</CardTitle>
        {!isEditing && role !== 'technician' && (
          <Button variant="ghost" size="sm" onClick={onStartEdit}>
            {t.common.edit}
          </Button>
        )}
      </CardHeader>

      <CardContent className="font-sans">
        {isEditing ? (
          <form onSubmit={onSave} className="space-y-4">
            {formState.actionError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
                {formState.actionError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label={t.actions.serviceType}
                value={formState.serviceType}
                onChange={(e) => formState.setServiceType(e.target.value)}
              >
                <option value="oil_change">Vidange & Filtres</option>
                <option value="repair">Réparation Mécanique</option>
                <option value="maintenance">Entretien Régulier</option>
                <option value="inspection">Contrôle / Diagnostic</option>
                <option value="tires">Pneumatiques</option>
                <option value="brakes">Freinage</option>
                <option value="bodywork">Carrosserie</option>
                <option value="custom">Autre Spécifique</option>
              </Select>

              <Select
                label={t.common.status}
                value={formState.status}
                onChange={(e) => formState.setStatus(e.target.value)}
              >
                <option value="open">{t.actions.statusPending}</option>
                <option value="in_progress">{t.actions.statusInProgress}</option>
                <option value="completed">{t.actions.statusCompleted}</option>
                <option value="invoiced">{t.invoices.statusIssued}</option>
              </Select>
            </div>

            <Textarea
              label={t.actions.title}
              required
              rows={3}
              value={formState.description}
              onChange={(e) => formState.setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={`${t.vehicles.mileage} (km)`}
                type="number"
                required
                value={formState.mileage}
                onChange={(e) => formState.setMileage(e.target.value)}
              />
              <Input
                label={`${t.actions.laborCost} (${t.common.currency})`}
                type="number"
                step="0.01"
                value={formState.laborCost}
                onChange={(e) => formState.setLaborCost(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t.actions.dateIn}
                type="date"
                required
                value={formState.dateIn}
                onChange={(e) => formState.setDateIn(e.target.value)}
              />
              <Input
                label={t.actions.dateOut}
                type="date"
                value={formState.dateOut}
                onChange={(e) => formState.setDateOut(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Textarea
                label="Remarques Visibles sur le Passeport Client"
                rows={2}
                placeholder="Conseils, prochaine vidange préconisée..."
                value={formState.clientVisibleNotes}
                onChange={(e) => formState.setClientVisibleNotes(e.target.value)}
              />
              <Textarea
                label="Notes Internes d'Atelier"
                rows={2}
                placeholder="Rapports d'essais, serrages..."
                value={formState.internalNotes}
                onChange={(e) => formState.setInternalNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button type="submit" isLoading={saving} className="flex-1">
                {t.common.save}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancelEdit} className="flex-1">
                {t.common.cancel}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                  {t.vehicles.plate}
                </span>
                <Link
                  href={`/admin/vehicles/${action.vehicle_id}`}
                  className="font-mono text-accent font-bold mt-0.5 block hover:underline"
                >
                  {action.plate_number} ({action.make} {action.model})
                </Link>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                  {t.clients.fullName}
                </span>
                <span className="text-text-primary font-semibold mt-0.5 block">
                  {action.client_name}
                </span>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-3">
              <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                {t.actions.title}
              </span>
              <p className="text-text-secondary mt-1 leading-relaxed whitespace-pre-wrap">
                {action.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border-subtle pt-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">{t.vehicles.mileage}</span>
                <span className="text-text-primary font-mono font-bold mt-0.5 block">
                  {action.mileage_at_service?.toLocaleString()} km
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">{t.actions.dateIn}</span>
                <span className="text-text-secondary mt-0.5 block">
                  {new Date(action.date_in).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">{t.actions.dateOut}</span>
                <span className="text-text-secondary mt-0.5 block">
                  {action.date_out ? new Date(action.date_out).toLocaleDateString() : 'En cours'}
                </span>
              </div>
            </div>

            {action.client_visible_notes && (
              <div className="border-t border-border-subtle pt-3">
                <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Notes Passeport Public
                </span>
                <p className="text-text-secondary mt-1 text-xs leading-relaxed bg-surface-base p-3 rounded-xl border border-border-subtle">
                  {action.client_visible_notes}
                </p>
              </div>
            )}

            {action.internal_notes && (
              <div className="border-t border-border-subtle pt-3">
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
                  Notes Internes Atelier
                </span>
                <p className="text-text-secondary mt-1 text-xs leading-relaxed bg-surface-base p-3 rounded-xl border border-border-subtle">
                  {action.internal_notes}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
