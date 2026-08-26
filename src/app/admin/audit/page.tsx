'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableLoadingState,
  TableEmptyState,
  Badge,
} from '@/components/ui';

interface AuditLog {
  id: string;
  user_name: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: any;
  created_at: string;
}

export default function AuditLogsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/audit');
        const json = await res.json();
        const rawList = json?.data !== undefined ? json.data : json;
        if (Array.isArray(rawList)) {
          setLogs(rawList);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (role === 'super_admin' || role === 'owner') {
      fetchLogs();
    }
  }, [role]);

  if (role !== 'super_admin' && role !== 'owner') {
    return (
      <div className="text-danger p-8 text-center bg-surface-raised border border-danger/20 rounded-2xl max-w-xl mx-auto space-y-2">
        <h3 className="font-bold">Accès Restreint</h3>
        <p className="text-xs text-text-muted">
          Le journal d&apos;audit et la traçabilité des mutations sont strictement réservés aux administrateurs.
        </p>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge variant="success">Création</Badge>;
      case 'update':
      case 'patch':
        return <Badge variant="info">Mise à jour</Badge>;
      case 'delete':
      case 'revoke':
        return <Badge variant="danger">Suppression</Badge>;
      case 'transfer':
        return <Badge variant="warning">Transfert</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Journal d'Audit & Sécurité"
        subtitle="Historique immuable de toutes les actions, créations et modifications effectuées sur la plateforme"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Audit & Sécurité' },
        ]}
      />

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Horodatage</TableHead>
            <TableHead>Opérateur</TableHead>
            <TableHead>Entité</TableHead>
            <TableHead>Type d&apos;Action</TableHead>
            <TableHead>Détails / Métadonnées</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={5} message="Chargement des journaux de sécurité..." />
          ) : logs.length === 0 ? (
            <TableEmptyState
              colSpan={5}
              title="Aucune trace d'audit enregistrée"
              description="Toutes les opérations sensibles apparaîtront automatiquement dans ce registre."
            />
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-text-muted whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </TableCell>
                <TableCell className="font-bold text-text-primary">
                  {log.user_name || <span className="text-text-disabled font-normal italic">Système</span>}
                </TableCell>
                <TableCell className="font-mono text-xs uppercase text-text-secondary">
                  {log.entity_type}
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell className="text-xs text-text-muted font-mono max-w-md truncate">
                  {typeof log.metadata === 'object'
                    ? JSON.stringify(log.metadata)
                    : log.metadata || '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
