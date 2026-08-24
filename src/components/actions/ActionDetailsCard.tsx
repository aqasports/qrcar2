import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea } from '@/components/ui';

interface ActionDetailsCardProps {
  action: any;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  formState: {
    serviceType: string;
    setServiceType: (v: any) => void;
    description: string;
    setDescription: (v: string) => void;
    clientVisibleNotes: string;
    setClientVisibleNotes: (v: string) => void;
    internalNotes: string;
    setInternalNotes: (v: string) => void;
    mileage: string;
    setMileage: (v: string) => void;
    status: string;
    setStatus: (v: any) => void;
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails & Paramètres de l&apos;Intervention</CardTitle>
        {!isEditing && role !== 'technician' && (
          <Button variant="ghost" size="sm" onClick={onStartEdit}>
            Modifier
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <form onSubmit={onSave} className="space-y-4">
            {formState.actionError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
                {formState.actionError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Type d'Opération"
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
                label="État d'Avancement"
                value={formState.status}
                onChange={(e) => formState.setStatus(e.target.value)}
              >
                <option value="open">Ouverte / En attente</option>
                <option value="in_progress">En Cours en Atelier</option>
                <option value="completed">Travaux Terminés</option>
                <option value="invoiced">Facturée & Clôturée</option>
              </Select>
            </div>

            <Textarea
              label="Description des Travaux"
              required
              rows={3}
              value={formState.description}
              onChange={(e) => formState.setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Kilométrage Compteur (km)"
                type="number"
                required
                value={formState.mileage}
                onChange={(e) => formState.setMileage(e.target.value)}
              />
              <Input
                label="Main d'œuvre (DZD)"
                type="number"
                step="0.01"
                value={formState.laborCost}
                onChange={(e) => formState.setLaborCost(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Date d'Entrée"
                type="date"
                required
                value={formState.dateIn}
                onChange={(e) => formState.setDateIn(e.target.value)}
              />
              <Input
                label="Date de Sortie / Restitution"
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
                Enregistrer les Modifications
              </Button>
              <Button type="button" variant="secondary" onClick={onCancelEdit} className="flex-1">
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                  Véhicule & Immatriculation
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
                  Propriétaire Client
                </span>
                <span className="text-text-primary font-semibold mt-0.5 block">
                  {action.client_name}
                </span>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-3">
              <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                Description de l&apos;Intervention
              </span>
              <p className="text-text-secondary mt-1 leading-relaxed whitespace-pre-wrap">
                {action.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border-subtle pt-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Kilométrage</span>
                <span className="text-text-primary font-mono font-bold mt-0.5 block">
                  {action.mileage_at_service?.toLocaleString()} km
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Date Entrée</span>
                <span className="text-text-secondary mt-0.5 block">
                  {new Date(action.date_in).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Date Sortie</span>
                <span className="text-text-secondary mt-0.5 block">
                  {action.date_out ? new Date(action.date_out).toLocaleDateString('fr-FR') : 'En cours'}
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
