import React from 'react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';

interface VehicleHeaderProps {
  vehicle: {
    plate_number: string;
    make: string;
    model: string;
    year: number;
  };
  activeCardToken?: string;
  onEditSpecs: () => void;
  onDeleteVehicle: () => void;
  role?: string;
}

export function VehicleHeader({
  vehicle,
  activeCardToken,
  onEditSpecs,
  onDeleteVehicle,
  role,
}: VehicleHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border-subtle">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Link href="/admin/vehicles" className="hover:text-text-primary transition-colors">
            Véhicules
          </Link>
          <span className="text-text-disabled">/</span>
          <span className="text-text-primary font-medium">Dossier Technique</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          <span className="text-lg text-text-muted font-bold">({vehicle.year})</span>
          <Badge variant="info" size="md" className="font-mono">
            {vehicle.plate_number}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {activeCardToken && (
          <Link href={`/v/${activeCardToken}`} target="_blank">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              }
            >
              Passeport QR Public
            </Button>
          </Link>
        )}
        {role !== 'technician' && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onEditSpecs}
              leftIcon={
                <svg className="w-3.5 h-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              Modifier Spécifications
            </Button>
            {role === 'owner' || role === 'manager' || role === 'super_admin' ? (
              <Button
                variant="danger"
                size="sm"
                onClick={onDeleteVehicle}
                leftIcon={
                  <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              >
                Supprimer
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
