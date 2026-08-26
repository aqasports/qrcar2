import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Select } from '@/components/ui';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year?: number;
  current_mileage?: number;
  client_id?: string;
  client_name?: string;
  fuel_type?: string;
  transmission?: string;
  engine_spec?: string;
  oil_type?: string;
  tire_size?: string;
  vin?: string;
}

interface VehicleSelectStepProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedVehicle: Vehicle | undefined;
}

export function VehicleSelectStep({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  searchQuery,
  onSearchChange,
  selectedVehicle,
}: VehicleSelectStepProps) {
  const { t } = useI18n();

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. {t.vehicles.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder={t.vehicles.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <Select
            label={t.actions.vehicle}
            required
            value={selectedVehicleId}
            onChange={(e) => onSelectVehicle(e.target.value)}
          >
            <option value="">-- {t.actions.vehicle} --</option>
            {filteredVehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate_number} — {v.make} {v.model} ({v.year}) [{v.client_name}]
              </option>
            ))}
          </Select>
        </div>

        {selectedVehicle && (
          <div className="p-4 rounded-xl bg-surface-base border border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                {t.vehicles.title.split('&')[0]}
              </span>
              <span className="font-bold text-text-primary mt-0.5 block">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                {t.clients.title.split('&')[0]}
              </span>
              <span className="font-bold text-text-primary mt-0.5 block">
                {selectedVehicle.client_name}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                {t.vehicles.mileage}
              </span>
              <span className="font-mono font-bold text-text-primary mt-0.5 block">
                {selectedVehicle.current_mileage?.toLocaleString()} km
              </span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                {t.vehicles.engineSpec} / {t.vehicles.oilType}
              </span>
              <span className="text-text-secondary mt-0.5 block">
                {selectedVehicle.fuel_type || 'Diesel'} — {selectedVehicle.oil_type || '5W-30'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
