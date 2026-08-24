import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from '@/components/ui';

interface VehicleOwnerCardProps {
  vehicle: any;
  clients: Array<{ id: string; full_name: string }>;
  isTransferring: boolean;
  selectedClientId: string;
  onSelectClientId: (id: string) => void;
  onStartTransfer: () => void;
  onCancelTransfer: () => void;
  onSubmitTransfer: (e: React.FormEvent) => void;
  onDetachOwnership: () => void;
  submitting: boolean;
  transferError: string;
  role?: string;
}

export function VehicleOwnerCard({
  vehicle,
  clients,
  isTransferring,
  selectedClientId,
  onSelectClientId,
  onStartTransfer,
  onCancelTransfer,
  onSubmitTransfer,
  onDetachOwnership,
  submitting,
  transferError,
  role,
}: VehicleOwnerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Propriétaire du Véhicule</CardTitle>
        {role !== 'technician' && !isTransferring && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onStartTransfer}>
              {vehicle.client_id ? 'Changer' : 'Attribuer'}
            </Button>
            {vehicle.client_id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDetachOwnership}
                isLoading={submitting}
                className="text-amber-400 hover:text-amber-300"
              >
                Déclarer Cédé / Vendu
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isTransferring ? (
          <form onSubmit={onSubmitTransfer} className="space-y-4">
            {transferError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
                {transferError}
              </div>
            )}
            <Select
              label="Sélectionner le Client Propriétaire"
              required
              value={selectedClientId}
              onChange={(e) => onSelectClientId(e.target.value)}
            >
              <option value="">-- Choisir un client dans le répertoire --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </Select>

            <div className="flex gap-2.5">
              <Button type="submit" isLoading={submitting} className="flex-1">
                Confirmer l&apos;Attribution
              </Button>
              <Button type="button" variant="secondary" onClick={onCancelTransfer} className="flex-1">
                Annuler
              </Button>
            </div>
          </form>
        ) : vehicle.client_id ? (
          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Titulaire Actuel
              </span>
              <Link
                href={`/admin/clients/${vehicle.client_id}`}
                className="text-sm font-bold text-text-primary hover:text-accent transition-colors block mt-0.5"
              >
                {vehicle.client_name}
              </Link>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-text-muted block">
                Numéro de Téléphone
              </span>
              <span className="text-xs text-text-secondary font-mono block mt-0.5">
                {vehicle.client_phone || '—'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 block">
              En attente de nouveau propriétaire
            </span>
            <p className="text-[11px] text-text-muted">
              Ce véhicule a été détaché lors d&apos;une cession/vente. Son carnet d&apos;entretien et sa carte PVC restent préservés.
            </p>
            {role !== 'technician' && (
              <Button variant="primary" size="sm" onClick={onStartTransfer} className="mt-2">
                Attribuer un Propriétaire
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
