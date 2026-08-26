import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Select, Textarea, Badge, Button } from '@/components/ui';
import { INTERVENTION_TEMPLATES, InterventionTemplate } from '@/lib/intervention-templates';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface TelemetryData {
  oilGrade: string;
  oilCapacityLiters: string;
  serviceResetDone: boolean;
  railPressureBars: string;
  injector1Correction: string;
  injector2Correction: string;
  injector3Correction: string;
  injector4Correction: string;
  frontPadsMm: string;
  rearPadsMm: string;
  frontDiscsMm: string;
  rearDiscsMm: string;
  brakeFluidBoilingTemp: string;
  sootLoadGrams: string;
  diffPressureMbar: string;
  adbluePouredLiters: string;
}

export type CheckpointStatus = 'ok' | 'warn' | 'fail';

export interface Worker {
  id: string;
  full_name: string;
  role: string;
}

export interface ServiceDetailsStepProps {
  activeSpecialtyId: string;
  onSelectSpecialty: (id: string) => void;
  serviceType: string;
  setServiceType: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  mileageAtService: string;
  setMileageAtService: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  laborCost: string;
  setLaborCost: (v: string) => void;
  leadWorkerId: string;
  setLeadWorkerId: (v: string) => void;
  workerHours: string;
  setWorkerHours: (v: string) => void;
  clientVisibleNotes: string;
  setClientVisibleNotes: (v: string) => void;
  internalNotes: string;
  setInternalNotes: (v: string) => void;
  workers: Worker[];
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  checkpointStatus: Record<string, CheckpointStatus>;
  setCheckpointStatus: React.Dispatch<React.SetStateAction<Record<string, CheckpointStatus>>>;
}

export function ServiceDetailsStep({
  activeSpecialtyId,
  onSelectSpecialty,
  serviceType,
  setServiceType,
  description,
  setDescription,
  mileageAtService,
  setMileageAtService,
  status,
  setStatus,
  laborCost,
  setLaborCost,
  leadWorkerId,
  setLeadWorkerId,
  workerHours,
  setWorkerHours,
  clientVisibleNotes,
  setClientVisibleNotes,
  internalNotes,
  setInternalNotes,
  workers,
  telemetry,
  setTelemetry,
  checkpointStatus,
  setCheckpointStatus,
}: ServiceDetailsStepProps) {
  const { t } = useI18n();

  const activeTemplate: InterventionTemplate | undefined = INTERVENTION_TEMPLATES.find(
    (item) => item.id === activeSpecialtyId
  );

  const handleCheckpointChange = (checkpointId: string, value: CheckpointStatus) => {
    setCheckpointStatus((prev) => ({
      ...prev,
      [checkpointId]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>2. {t.actions.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 font-sans">
        {/* Specialty Selector Chips */}
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            {t.actions.serviceType}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {INTERVENTION_TEMPLATES.map((tmpl) => {
              const isSelected = activeSpecialtyId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => onSelectSpecialty(tmpl.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-accent/15 border-accent text-white shadow-lg shadow-blue-500/10'
                      : 'bg-surface-base border-border-subtle hover:border-border-default text-text-muted hover:text-text-primary'
                  }`}
                >
                  <span className="text-xs font-bold block">{tmpl.name}</span>
                  <span className="text-[10px] text-text-muted block mt-0.5 capitalize">{tmpl.specialty}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label={t.actions.serviceType}
            required
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="maintenance">Entretien & Vidange</option>
            <option value="repair">Réparation Mécanique</option>
            <option value="inspection">Contrôle / Diagnostic</option>
            <option value="other">Autre Opération</option>
          </Select>

          <Input
            label={`${t.vehicles.mileage} (km)`}
            type="number"
            required
            value={mileageAtService}
            onChange={(e) => setMileageAtService(e.target.value)}
          />

          <Select
            label={t.common.status}
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="in_progress">{t.actions.statusInProgress}</option>
            <option value="open">{t.actions.statusPending}</option>
            <option value="completed">{t.actions.statusCompleted}</option>
          </Select>
        </div>

        <Textarea
          label={t.actions.title}
          required
          rows={3}
          placeholder="Détail des réparations..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Specialty Conditional Telemetry Panels */}
        {activeSpecialtyId === 'oil_service' && (
          <div className="p-4 rounded-2xl bg-surface-base/80 border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                Télémétrie Lubrification & Remise à Zéro (RAZ)
              </span>
              <Badge variant="info">Normes Constructeur</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label={t.vehicles.oilType}
                value={telemetry.oilGrade}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, oilGrade: e.target.value }))}
              >
                <option value="5W-30 C3 / RN0720">5W-30 C3 / RN0720 (FAP & DPF)</option>
                <option value="5W-40 A3/B4">5W-40 A3/B4 (Synthèse Haute Perf.)</option>
                <option value="0W-20 / 0W-30 Eco">0W-20 / 0W-30 Eco (Euro 6d)</option>
                <option value="10W-40 Semi-synthèse">10W-40 Semi-synthèse</option>
              </Select>

              <Input
                label="Capacité Remplie (Litres)"
                type="text"
                value={telemetry.oilCapacityLiters}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, oilCapacityLiters: e.target.value }))}
                placeholder="4.5"
              />

              <div className="space-y-1.5 font-sans">
                <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  Remise à Zéro Indicateur
                </label>
                <Button
                  type="button"
                  variant={telemetry.serviceResetDone ? 'secondary' : 'ghost'}
                  className={`w-full h-10 ${
                    telemetry.serviceResetDone
                      ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                      : 'border-border-subtle text-text-muted'
                  }`}
                  onClick={() =>
                    setTelemetry((prev) => ({ ...prev, serviceResetDone: !prev.serviceResetDone }))
                  }
                  leftIcon={
                    telemetry.serviceResetDone ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    ) : undefined
                  }
                >
                  {telemetry.serviceResetDone ? 'Réinitialisation Effectuée [OK]' : 'En attente de RAZ'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeSpecialtyId === 'injection_diesel' && (
          <div className="p-4 rounded-2xl bg-surface-base/80 border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                Banc Diagnostic Électronique & Débits Injecteurs
              </span>
              <Badge variant="info">Paramètres OBD-II</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <Input
                label="Pression Rail (Bars)"
                type="text"
                className="font-mono"
                value={telemetry.railPressureBars}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, railPressureBars: e.target.value }))}
              />
              <Input
                label="Débit Cyl. 1 (mg/cp)"
                type="text"
                className="font-mono"
                value={telemetry.injector1Correction}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, injector1Correction: e.target.value }))}
              />
              <Input
                label="Débit Cyl. 2 (mg/cp)"
                type="text"
                className="font-mono"
                value={telemetry.injector2Correction}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, injector2Correction: e.target.value }))}
              />
              <Input
                label="Débit Cyl. 3 (mg/cp)"
                type="text"
                className="font-mono"
                value={telemetry.injector3Correction}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, injector3Correction: e.target.value }))}
              />
              <Input
                label="Débit Cyl. 4 (mg/cp)"
                type="text"
                className="font-mono"
                value={telemetry.injector4Correction}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, injector4Correction: e.target.value }))}
              />
            </div>
          </div>
        )}

        {activeSpecialtyId === 'brakes_chassis' && (
          <div className="p-4 rounded-2xl bg-surface-base/80 border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                Mesures Épaisseurs Disques / Plaquettes & Point d&apos;Ébullition
              </span>
              <Badge variant="warning">Sécurité & Liaisons</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Input
                label="Plaquettes AV (mm)"
                type="text"
                className="font-mono"
                value={telemetry.frontPadsMm}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, frontPadsMm: e.target.value }))}
              />
              <Input
                label="Plaquettes AR (mm)"
                type="text"
                className="font-mono"
                value={telemetry.rearPadsMm}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, rearPadsMm: e.target.value }))}
              />
              <Input
                label="Disques AV (mm)"
                type="text"
                className="font-mono"
                value={telemetry.frontDiscsMm}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, frontDiscsMm: e.target.value }))}
              />
              <Input
                label="Disques AR (mm)"
                type="text"
                className="font-mono"
                value={telemetry.rearDiscsMm}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, rearDiscsMm: e.target.value }))}
              />
              <Input
                label="T° Ébullition DOT4"
                type="text"
                className="font-mono"
                value={telemetry.brakeFluidBoilingTemp}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, brakeFluidBoilingTemp: e.target.value }))}
              />
            </div>
          </div>
        )}

        {activeSpecialtyId === 'exhaust_emissions' && (
          <div className="p-4 rounded-2xl bg-surface-base/80 border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent uppercase tracking-wider block">
                Dépollution, Régénération FAP & Circuit AdBlue
              </span>
              <Badge variant="info">Normes Antipollution</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Masse de Suie Résiduelle (g)"
                type="text"
                className="font-mono"
                value={telemetry.sootLoadGrams}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, sootLoadGrams: e.target.value }))}
              />
              <Input
                label="Pression Différentielle (mbar)"
                type="text"
                className="font-mono"
                value={telemetry.diffPressureMbar}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, diffPressureMbar: e.target.value }))}
              />
              <Input
                label="Volume AdBlue Ajouté (L)"
                type="text"
                className="font-mono"
                value={telemetry.adbluePouredLiters}
                onChange={(e) => setTelemetry((prev) => ({ ...prev, adbluePouredLiters: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Quality Checkpoints Checklist */}
        {activeTemplate && activeTemplate.checkpoints && activeTemplate.checkpoints.length > 0 && (
          <div className="p-4 rounded-2xl bg-surface-base/80 border border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                  Points de Contrôle Qualité Atelier ({activeTemplate.checkpoints.length} Points)
                </span>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Évaluation de conformité enregistrée sur le carnet d&apos;entretien numérique
                </p>
              </div>
              <Badge variant="neutral">Assurance Qualité</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeTemplate.checkpoints.map((cp) => {
                const currentVal: CheckpointStatus = checkpointStatus[cp.id] || 'ok';
                return (
                  <div
                    key={cp.id}
                    className="p-3 rounded-xl bg-surface-raised border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted px-1.5 py-0.5 rounded bg-surface-base border border-border-subtle inline-block mb-1">
                        {cp.category}
                      </span>
                      <p className="text-xs font-medium text-text-primary leading-snug">{cp.label}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant={currentVal === 'ok' ? 'secondary' : 'ghost'}
                        className={`h-7 px-2 text-[10px] ${
                          currentVal === 'ok'
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold'
                            : 'text-text-muted'
                        }`}
                        onClick={() => handleCheckpointChange(cp.id, 'ok')}
                      >
                        OK
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentVal === 'warn' ? 'secondary' : 'ghost'}
                        className={`h-7 px-2 text-[10px] ${
                          currentVal === 'warn'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 font-bold'
                            : 'text-text-muted'
                        }`}
                        onClick={() => handleCheckpointChange(cp.id, 'warn')}
                      >
                        Vigilance
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant={currentVal === 'fail' ? 'secondary' : 'ghost'}
                        className={`h-7 px-2 text-[10px] ${
                          currentVal === 'fail'
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 font-bold'
                            : 'text-text-muted'
                        }`}
                        onClick={() => handleCheckpointChange(cp.id, 'fail')}
                      >
                        Remplacé
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label={t.workers.title.split('&')[0]}
            value={leadWorkerId}
            onChange={(e) => setLeadWorkerId(e.target.value)}
          >
            <option value="">-- {t.workers.title.split('&')[0]} --</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} ({w.role})
              </option>
            ))}
          </Select>

          <Input
            label={`${t.actions.laborCost} (h)`}
            type="number"
            step="0.5"
            value={workerHours}
            onChange={(e) => setWorkerHours(e.target.value)}
          />

          <Input
            label={`${t.actions.laborCost} (${t.common.currency})`}
            type="number"
            step="0.01"
            value={laborCost}
            onChange={(e) => setLaborCost(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Textarea
            label="Notes Client (Visibles sur le Passeport QR)"
            rows={2}
            placeholder="Conseils d'usage..."
            value={clientVisibleNotes}
            onChange={(e) => setClientVisibleNotes(e.target.value)}
          />
          <Textarea
            label="Notes Internes Atelier"
            rows={2}
            placeholder="Détails techniques..."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
