'use client';

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Input,
  Select,
  Combobox,
  Badge,
} from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface ClientOption {
  id: string;
  full_name: string;
  phone: string;
}

export interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientOption[];
  onVehicleCreated: () => void;
}

interface DecodedVinCardInfo {
  make: string;
  model: string;
  year: number | null;
  trim: string | null;
  bodyClass: string | null;
  engineSpec: string | null;
  fuelType: string | null;
  oilType: string | null;
  tireSize: string | null;
  driveType: string | null;
  country: string | null;
  source: string;
}

export function AddVehicleModal({
  isOpen,
  onClose,
  clients,
  onVehicleCreated,
}: AddVehicleModalProps) {
  const { toast } = useToast();
  const { t } = useI18n();

  const [clientId, setClientId] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [mileage, setMileage] = useState('0');
  const [vin, setVin] = useState('');
  const [color, setColor] = useState('');
  const [fuelType, setFuelType] = useState('diesel');
  const [transmission, setTransmission] = useState('manuelle');
  const [engineSpec, setEngineSpec] = useState('');
  const [oilType, setOilType] = useState('5W-30');
  const [tireSize, setTireSize] = useState('');

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decodingVin, setDecodingVin] = useState(false);
  const [decodedInfo, setDecodedInfo] = useState<DecodedVinCardInfo | null>(null);

  const resetForm = () => {
    setClientId('');
    setPlateNumber('');
    setMake('');
    setModel('');
    setYear(new Date().getFullYear().toString());
    setMileage('0');
    setVin('');
    setColor('');
    setFuelType('diesel');
    setTransmission('manuelle');
    setEngineSpec('');
    setOilType('5W-30');
    setTireSize('');
    setFormError('');
    setDecodedInfo(null);
  };

  const handleDecodeVin = async () => {
    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin.length !== 17) {
      toast.error(t.vehicles.vinHelp);
      return;
    }

    try {
      setDecodingVin(true);
      setDecodedInfo(null);

      const res = await fetch(`/api/vin/decode?vin=${encodeURIComponent(cleanVin)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Impossible de décoder ce numéro VIN.');
      }

      if (data.make) setMake(data.make);
      if (data.model) setModel(data.model);
      if (data.year) setYear(data.year.toString());

      if (data.fuel_type) {
        const ft = data.fuel_type.toLowerCase();
        if (ft.includes('diesel')) setFuelType('diesel');
        else if (ft.includes('essence') || ft.includes('gasoline')) setFuelType('essence');
        else if (ft.includes('hybride') || ft.includes('hybrid')) setFuelType('hybride');
        else if (ft.includes('electrique') || ft.includes('electric')) setFuelType('electrique');
        else if (ft.includes('gpl') || ft.includes('lpg')) setFuelType('gpl');
      }

      if (data.transmission_style) {
        setTransmission(data.transmission_style.toLowerCase().includes('auto') ? 'automatique' : 'manuelle');
      }

      const engineParts = [
        data.engine_displacement_l ? `${data.engine_displacement_l}L` : '',
        data.horse_power ? `${data.horse_power}` : '',
        data.engine_code ? `[${data.engine_code}]` : '',
        data.engine_cylinders ? `(${data.engine_cylinders})` : '',
      ].filter(Boolean);

      const compiledEngineSpec = engineParts.length > 0 ? engineParts.join(' ') : (data.engine_code || '');
      if (compiledEngineSpec) setEngineSpec(compiledEngineSpec);

      if (data.oil_type_recommended) {
        setOilType(data.oil_type_recommended);
      }

      if (data.tire_size_recommended) {
        setTireSize(data.tire_size_recommended);
      }

      setDecodedInfo({
        make: data.make || 'Véhicule',
        model: data.model || 'Modèle Identifié',
        year: data.year || null,
        trim: data.trim || null,
        bodyClass: data.body_class || null,
        engineSpec: compiledEngineSpec || null,
        fuelType: data.fuel_type || 'Diesel',
        oilType: data.oil_type_recommended || '5W-30',
        tireSize: data.tire_size_recommended || null,
        driveType: data.drive_type || null,
        country: data.plant_country || null,
        source: data.source || 'hybrid',
      });

      toast.success(`${t.vehicles.vinSuccess} : ${data.make} ${data.model} (${data.year || ''})`);
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Erreur lors du décodage VIN.';
      toast.error(errorText);
    } finally {
      setDecodingVin(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!plateNumber.trim() || !make.trim() || !model.trim() || !year.trim()) {
      setFormError("Veuillez renseigner l'immatriculation, la marque, le modèle et l'année.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId || null,
          plate_number: plateNumber.trim().toUpperCase(),
          make: make.trim(),
          model: model.trim(),
          year: parseInt(year, 10),
          vin: vin.trim().toUpperCase() || null,
          color: color.trim() || null,
          current_mileage: parseInt(mileage, 10) || 0,
          fuel_type: fuelType,
          transmission,
          engine_spec: engineSpec.trim() || null,
          oil_type: oilType.trim() || null,
          tire_size: tireSize.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du véhicule.');
      }

      toast.success('Véhicule enregistré avec succès dans le parc atelier.');
      resetForm();
      onClose();
      onVehicleCreated();
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Erreur inconnue';
      setFormError(errorText);
      toast.error(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  const clientOptions = clients.map((c) => ({
    value: c.id,
    label: c.full_name,
    sublabel: c.phone,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.vehicles.addVehicle}
      description={t.vehicles.subtitle}
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={submitting}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t.common.save}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
            {formError}
          </div>
        )}

        {/* VIN Auto-Fill Section */}
        <div className="p-4 rounded-2xl bg-surface-base border border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <span>{t.vehicles.vin}</span>
              <Badge variant="info" size="sm">ISO 3779</Badge>
            </label>
            <span className="text-[10px] text-text-muted font-mono">{t.vehicles.vinHelp}</span>
          </div>

          <div className="flex gap-2">
            <Input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Ex: WBA3D3108DF123456 (BMW), VF1BH0... (Clio)"
              className="font-mono uppercase text-xs"
              maxLength={17}
            />
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={handleDecodeVin}
              isLoading={decodingVin}
              disabled={vin.trim().length !== 17 || decodingVin}
              className="shrink-0 font-bold"
            >
              {t.vehicles.decodeVin}
            </Button>
          </div>

          {/* Decoded Telemetry Card Preview */}
          {decodedInfo && (
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border-default space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-text-primary">
                    {decodedInfo.make} {decodedInfo.model} {decodedInfo.year ? `(${decodedInfo.year})` : ''}
                  </span>
                  {decodedInfo.trim && (
                    <Badge variant="warning" size="sm">{decodedInfo.trim}</Badge>
                  )}
                </div>
                <span className="text-[10px] font-mono text-text-muted uppercase">
                  {decodedInfo.country || 'Europe'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2 border-t border-border-subtle/60">
                <div>
                  <span className="text-[10px] text-text-muted block uppercase">{t.vehicles.engineSpec}</span>
                  <span className="font-semibold text-text-secondary truncate block">{decodedInfo.engineSpec || '2.0L Diesel'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block uppercase">{t.vehicles.fuel}</span>
                  <span className="font-semibold text-text-secondary block">{decodedInfo.fuelType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block uppercase">{t.vehicles.oilType}</span>
                  <span className="font-semibold text-accent block truncate">{decodedInfo.oilType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block uppercase">{t.vehicles.tireSize}</span>
                  <span className="font-semibold text-text-secondary block truncate">{decodedInfo.tireSize || '225/45 R17'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Client Owner Selector with Combobox */}
        <Combobox
          label={t.vehicles.client}
          options={clientOptions}
          value={clientId}
          onChange={setClientId}
          placeholder={t.clients.searchPlaceholder}
          searchPlaceholder={t.clients.searchPlaceholder}
          emptyMessage={t.clients.noClients}
        />

        {/* Core Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t.vehicles.plate}
            required
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="Ex: 00123-116-16"
            className="font-mono uppercase font-bold"
          />

          <Input
            label={t.vehicles.make}
            required
            value={make}
            onChange={(e) => setMake(e.target.value)}
            placeholder="Ex: BMW, Renault, Volkswagen, Peugeot"
          />

          <Input
            label={t.vehicles.model}
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Ex: Série 3 (F30 320d), Golf 7, Clio 4"
          />

          <Input
            label={t.vehicles.year}
            required
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2016"
          />

          <Input
            label={t.vehicles.mileage}
            type="number"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            placeholder="120000"
          />

          <Input
            label={t.vehicles.color}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Ex: Noir Saphir, Gris Minéral, Blanc Alpin"
          />
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border-subtle">
          <Select
            label={t.vehicles.fuel}
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            options={[
              { value: 'diesel', label: 'Diesel' },
              { value: 'essence', label: 'Essence' },
              { value: 'gpl', label: 'GPL' },
              { value: 'hybride', label: 'Hybride' },
              { value: 'electrique', label: 'Électrique' },
            ]}
          />

          <Select
            label={t.vehicles.transmission}
            value={transmission}
            onChange={(e) => setTransmission(e.target.value)}
            options={[
              { value: 'manuelle', label: 'Manuelle' },
              { value: 'automatique', label: 'Automatique' },
              { value: 'robotisee', label: 'Robotisée' },
            ]}
          />

          <Input
            label={t.vehicles.oilType}
            value={oilType}
            onChange={(e) => setOilType(e.target.value)}
            placeholder="Ex: BMW Longlife-04 5W-30"
          />

          <Input
            label={t.vehicles.engineSpec}
            value={engineSpec}
            onChange={(e) => setEngineSpec(e.target.value)}
            placeholder="Ex: 2.0L TwinPower 190ch B47"
          />

          <Input
            label={t.vehicles.tireSize}
            value={tireSize}
            onChange={(e) => setTireSize(e.target.value)}
            placeholder="Ex: 225/45 R17 / 225/40 R18"
          />
        </div>
      </form>
    </Modal>
  );
}
