'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Spinner } from '@/components/ui';

export interface VehicleLookupProps {
  vehicle: {
    id: string;
    plate_number: string;
    make: string;
    model: string;
    year?: number;
    vin?: string | null;
    current_mileage?: number;
    fuel_type?: string | null;
    engine_spec?: string | null;
    oil_type?: string | null;
    tire_size?: string | null;
    client_name?: string | null;
  } | null;
  onApplySpecs?: (specs: { oil_type?: string; tire_size?: string; engine_spec?: string }) => void;
}

export function VehicleLookupPanel({ vehicle, onApplySpecs }: VehicleLookupProps) {
  const [loading, setLoading] = useState(false);
  const [decodedSpecs, setDecodedSpecs] = useState<any | null>(null);
  const [error, setError] = useState('');

  if (!vehicle) return null;

  const handleDecodeVin = async () => {
    if (!vehicle.vin) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vehicle-lookup?vin=${encodeURIComponent(vehicle.vin)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de décoder le VIN.');
      } else {
        setDecodedSpecs(data.data);
        if (onApplySpecs && data.data) {
          onApplySpecs({
            oil_type: data.data.oilTypeRecommended,
            tire_size: data.data.tireSizeRecommended,
            engine_spec: data.data.engineCode || data.data.engineDisplacementL ? `${data.data.engineDisplacementL}L ${data.data.fuelType || ''}` : undefined,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erreur lors du décodage du véhicule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-surface-raised border border-border-default font-sans space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-surface-base border border-border-default text-accent text-xs">
            {vehicle.plate_number}
          </span>
          <span className="font-bold text-sm text-text-primary">
            {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
          </span>
          {vehicle.client_name && (
            <span className="text-xs text-text-muted">
              • Client : <strong className="text-text-secondary">{vehicle.client_name}</strong>
            </span>
          )}
        </div>

        {vehicle.vin && !decodedSpecs && (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={handleDecodeVin}
            isLoading={loading}
            leftIcon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Décoder Caractéristiques VIN
          </Button>
        )}
      </div>

      {error && (
        <div className="p-2 rounded bg-danger/10 border border-danger/25 text-danger text-xs">
          {error}
        </div>
      )}

      {/* Grid of Vehicle Characteristics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-text-muted block">Kilométrage Actuel</span>
          <span className="font-mono font-bold text-text-primary">
            {(vehicle.current_mileage || 0).toLocaleString()} km
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-text-muted block">Motorisation / Énergie</span>
          <span className="font-medium text-text-primary capitalize">
            {vehicle.fuel_type || 'Diesel'} {vehicle.engine_spec ? `(${vehicle.engine_spec})` : ''}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-text-muted block">Huile Préconisée</span>
          <span className="font-mono font-semibold text-accent">
            {decodedSpecs?.oilTypeRecommended || vehicle.oil_type || '5W-30 C3'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-text-muted block">Numéro de Châssis (VIN)</span>
          <span className="font-mono text-text-secondary text-[11px] select-all">
            {vehicle.vin || 'Non renseigné'}
          </span>
        </div>
      </div>

      {/* Decoded VIN Technical Details Drawer */}
      {decodedSpecs && (
        <div className="p-3 bg-surface-base rounded-xl border border-border-subtle space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
              Spécifications Usine Détectées (Source : {decodedSpecs.source})
            </span>
            <Badge variant="success">Homologué</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            {decodedSpecs.engineDisplacementL && (
              <div>
                <span className="text-text-muted block">Cylindrée :</span>
                <span className="font-mono font-bold text-text-primary">{decodedSpecs.engineDisplacementL} L</span>
              </div>
            )}
            {decodedSpecs.horsePower && (
              <div>
                <span className="text-text-muted block">Puissance :</span>
                <span className="font-mono font-bold text-text-primary">{decodedSpecs.horsePower} ch</span>
              </div>
            )}
            {decodedSpecs.transmissionStyle && (
              <div>
                <span className="text-text-muted block">Transmission :</span>
                <span className="font-medium text-text-primary">{decodedSpecs.transmissionStyle}</span>
              </div>
            )}
            {decodedSpecs.tireSizeRecommended && (
              <div>
                <span className="text-text-muted block">Pneumatiques :</span>
                <span className="font-mono font-semibold text-text-primary">{decodedSpecs.tireSizeRecommended}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
