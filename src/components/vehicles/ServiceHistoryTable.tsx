import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Badge,
  Button,
} from '@/components/ui';

interface ServiceAction {
  id: string;
  type: string;
  description: string;
  status: string;
  mileage_at_service: number;
  date_in: string;
  date_out: string | null;
}

interface ServiceHistoryTableProps {
  actions: ServiceAction[];
  onLogAction: () => void;
  role?: string;
}

export function ServiceHistoryTable({
  actions,
  onLogAction,
  role,
}: ServiceHistoryTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'invoiced':
        return <Badge variant="success">Terminé</Badge>;
      case 'in_progress':
        return <Badge variant="info" pulse>En Cours</Badge>;
      case 'pending':
      case 'open':
        return <Badge variant="warning">Ouvert</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Interventions</CardTitle>
        {role !== 'technician' && (
          <Button variant="primary" size="sm" onClick={onLogAction}>
            Nouvelle Intervention
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        <Table className="rounded-none border-0 shadow-none">
          <TableHeader>
            <tr>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Kilométrage</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Détails</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {actions.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                title="Aucune intervention enregistrée"
                description="Ce véhicule ne possède pour le moment aucun historique d'intervention dans l'atelier."
                action={
                  role !== 'technician' ? (
                    <Button variant="secondary" size="sm" onClick={onLogAction}>
                      Créer une Première Intervention
                    </Button>
                  ) : null
                }
              />
            ) : (
              actions.map((act) => (
                <TableRow key={act.id}>
                  <TableCell className="text-text-muted font-medium whitespace-nowrap">
                    {new Date(act.date_in).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="font-bold text-text-primary capitalize">
                    {act.type}
                  </TableCell>
                  <TableCell className="text-text-secondary max-w-xs truncate">
                    {act.description}
                  </TableCell>
                  <TableCell className="font-mono text-text-muted whitespace-nowrap">
                    {act.mileage_at_service?.toLocaleString()} km
                  </TableCell>
                  <TableCell>{getStatusBadge(act.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/actions/${act.id}`}
                      className="inline-flex items-center text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                    >
                      Consulter
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
