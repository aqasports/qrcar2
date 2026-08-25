import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';

export interface VehicleSpecsData {
  plate_number?: string;
  make?: string;
  model?: string;
  year?: number | string;
  vin?: string;
  color?: string;
  current_mileage?: number | string;
  fuel_type?: string;
  transmission?: string;
  engine_spec?: string;
  oil_type?: string;
  tire_size?: string;
  next_service_mileage?: number | string;
  next_service_date?: string;
  next_inspection_date?: string;
}

interface VehicleSpecsCardProps {
  vehicle: VehicleSpecsData | null;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveSpecs: (e: React.FormEvent) => void;
  saving: boolean;
  formState: {
    plateNumber: string;
    setPlateNumber: (v: string) => void;
    make: string;
    setMake: (v: string) => void;
    model: string;
    setModel: (v: string) => void;
    year: string;
    setYear: (v: string) => void;
    vin: string;
    setVin: (v: string) => void;
    color: string;
    setColor: (v: string) => void;
    mileage: string;
    setMileage: (v: string) => void;
    fuelType: string;
    setFuelType: (v: string) => void;
    transmission: string;
    setTransmission: (v: string) => void;
    engineSpec: string;
    setEngineSpec: (v: string) => void;
    oilType: string;
    setOilType: (v: string) => void;
    tireSize: string;
    setTireSize: (v: string) => void;
    nextServiceMileage: string;
    setNextServiceMileage: (v: string) => void;
    nextServiceDate: string;
    setNextServiceDate: (v: string) => void;
    nextInspectionDate: string;
    setNextInspectionDate: (v: string) => void;
    specsError: string;
  };
  role?: string;
}

export function VehicleSpecsCard({
  vehicle,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveSpecs,
  saving,
  formState,
  role,
}: VehicleSpecsCardProps) {
  if (!vehicle) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spécifications Techniques</CardTitle>
        {!isEditing && role !== 'technician' && (
          <Button variant="ghost" size="sm" onClick={onStartEdit}>
            Modifier
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <form onSubmit={onSaveSpecs} className="space-y-4">
            {formState.specsError && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
                {formState.specsError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Immatriculation"
                required
                value={formState.plateNumber}
                onChange={(e) => formState.setPlateNumber(e.target.value)}
                placeholder="ex. 01234-116-16"
              />
              <Input
                label="Kilométrage (km)"
                type="number"
                required
                value={formState.mileage}
                onChange={(e) => formState.setMileage(e.target.value)}
                placeholder="ex. 85000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Marque"
                required
                value={formState.make}
                onChange={(e) => formState.setMake(e.target.value)}
                placeholder="ex. Renault"
              />
              <Input
                label="Modèle"
                required
                value={formState.model}
                onChange={(e) => formState.setModel(e.target.value)}
                placeholder="ex. Clio 4"
              />
              <Input
                label="Année"
                type="number"
                required
                value={formState.year}
                onChange={(e) => formState.setYear(e.target.value)}
                placeholder="ex. 2019"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Carburant"
                value={formState.fuelType}
                onChange={(e) => formState.setFuelType(e.target.value)}
              >
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
                <option value="GPL">GPL</option>
              </Select>
              <Select
                label="Transmission"
                value={formState.transmission}
                onChange={(e) => formState.setTransmission(e.target.value)}
              >
                <option value="Manuelle">Manuelle</option>
                <option value="Automatique">Automatique</option>
              </Select>
            </div>

            <Input
              label="Motorisation / Cylindrée"
              placeholder="ex. 1.5 dCi 85ch"
              value={formState.engineSpec}
              onChange={(e) => formState.setEngineSpec(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Huile Moteur Préconisée"
                placeholder="ex. 5W-30 ACEA C3"
                value={formState.oilType}
                onChange={(e) => formState.setOilType(e.target.value)}
              />
              <Input
                label="Dimension Pneus"
                placeholder="ex. 195/55 R16"
                value={formState.tireSize}
                onChange={(e) => formState.setTireSize(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Couleur"
                placeholder="ex. Blanc Glacier"
                value={formState.color}
                onChange={(e) => formState.setColor(e.target.value)}
              />
              <Input
                label="Numéro de Châssis (VIN)"
                placeholder="ex. VF1..."
                value={formState.vin}
                onChange={(e) => formState.setVin(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="pt-3 border-t border-border-subtle space-y-3">
              <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                Échéances d&apos;Entretien
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Prochain Entretien (km)"
                  type="number"
                  placeholder="ex. 95000"
                  value={formState.nextServiceMileage}
                  onChange={(e) => formState.setNextServiceMileage(e.target.value)}
                />
                <Input
                  label="Date Prochain Entretien"
                  type="date"
                  value={formState.nextServiceDate}
                  onChange={(e) => formState.setNextServiceDate(e.target.value)}
                />
              </div>
              <Input
                label="Date Prochain Contrôle Technique"
                type="date"
                value={formState.nextInspectionDate}
                onChange={(e) => formState.setNextInspectionDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2.5 pt-3">
              <Button type="submit" isLoading={saving} className="flex-1">
                Enregistrer
              </Button>
              <Button type="button" variant="secondary" onClick={onCancelEdit} className="flex-1">
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">
                Immatriculation
              </span>
              <span className="inline-block bg-surface-base border border-border-default px-3 py-1 font-mono text-text-primary rounded-lg mt-1 font-bold">
                {vehicle.plate_number}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Marque / Modèle</span>
                <span className="text-text-primary font-bold mt-0.5 block">{vehicle.make} {vehicle.model}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Année</span>
                <span className="text-text-secondary mt-0.5 block">{vehicle.year}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Kilométrage Actuel</span>
                <span className="text-text-primary font-mono font-bold mt-0.5 block">{vehicle.current_mileage?.toLocaleString()} km</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Transmission</span>
                <span className="text-text-secondary mt-0.5 block">{vehicle.transmission || 'Manuelle'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Carburant / Moteur</span>
                <span className="text-text-secondary mt-0.5 block">{vehicle.fuel_type || 'Diesel'} {vehicle.engine_spec ? `(${vehicle.engine_spec})` : ''}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Huile Préconisée</span>
                <span className="text-accent font-mono font-semibold mt-0.5 block text-xs">{vehicle.oil_type || '5W-30 ACEA C3'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3">
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Pneumatiques</span>
                <span className="text-text-secondary font-mono mt-0.5 block text-xs">{vehicle.tire_size || '—'}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Couleur</span>
                <span className="text-text-secondary mt-0.5 block">{vehicle.color || '—'}</span>
              </div>
            </div>

            <div className="border-t border-border-subtle pt-3">
              <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider block">Numéro de Châssis (VIN)</span>
              <span className="text-text-secondary font-mono mt-0.5 block truncate text-xs">{vehicle.vin || '—'}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
