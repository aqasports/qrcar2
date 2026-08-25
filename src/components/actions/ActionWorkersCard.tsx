import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';

export interface WorkerAssignment {
  assignment_id?: string;
  worker_id: string;
  role_on_job: 'lead' | 'assist';
  hours_spent?: number;
  full_name: string;
  worker_role?: string;
}

interface ActionWorkersCardProps {
  assignedWorkers: WorkerAssignment[];
  onOpenAssignModal: () => void;
  onRemoveWorker: (workerId: string) => void;
  role?: string;
}

export function ActionWorkersCard({
  assignedWorkers,
  onOpenAssignModal,
  onRemoveWorker,
  role,
}: ActionWorkersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipe & Intervenants Atelier</CardTitle>
        {role !== 'technician' && (
          <Button variant="ghost" size="sm" onClick={onOpenAssignModal}>
            Assigner
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {assignedWorkers.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-muted">
            Aucun technicien ou apprenti n&apos;est actuellement assigné.
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignedWorkers.map((w) => (
              <div
                key={w.worker_id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-base border border-border-subtle"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-overlay border border-border-default flex items-center justify-center font-bold text-xs text-text-primary">
                    {w.full_name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      {w.full_name}
                    </span>
                    <span className="text-[10px] text-text-muted block">
                      {w.worker_role || 'Technicien'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={w.role_on_job === 'lead' ? 'info' : 'neutral'}>
                    {w.role_on_job === 'lead' ? 'Responsable' : 'Assistant'}
                  </Badge>

                  {role !== 'technician' && (
                    <button
                      type="button"
                      onClick={() => onRemoveWorker(w.worker_id)}
                      className="text-text-muted hover:text-danger p-1 rounded transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
