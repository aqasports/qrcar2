import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import FlippablePvcCard from '@/components/FlippablePvcCard';

interface VehiclePvcCardProps {
  activeCard: any;
  vehicle: any;
  onOpenLinkModal: () => void;
  onRevokeCard: () => void;
  isRevoking: boolean;
  role?: string;
}

export function VehiclePvcCard({
  activeCard,
  vehicle,
  onOpenLinkModal,
  onRevokeCard,
  isRevoking,
  role,
}: VehiclePvcCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carte d&apos;Identité PVC Numérique</CardTitle>
        {activeCard && role !== 'technician' && (
          <Button
            variant="danger"
            size="sm"
            onClick={onRevokeCard}
            isLoading={isRevoking}
          >
            Révoquer la Carte
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {activeCard ? (
          <div className="flex flex-col items-center justify-center p-4 bg-surface-base border border-border-subtle rounded-xl">
            <FlippablePvcCard
              token={activeCard.token}
              serialLabel={activeCard.serial_label}
              status={activeCard.status}
              vehiclePlate={vehicle?.plate_number}
              vehicleMakeModel={`${vehicle?.make} ${vehicle?.model} (${vehicle?.year})`}
              size="md"
              showControls={true}
            />
          </div>
        ) : (
          <div className="bg-surface-base p-6 border border-border-subtle rounded-xl text-center space-y-3">
            <p className="text-text-muted text-xs">
              Ce véhicule n&apos;est pas encore associé à un passeport physique PVC.
            </p>
            {role !== 'technician' && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenLinkModal}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                }
              >
                Associer une Carte PVC Vierge
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
