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
  Button,
  Input,
  Select,
  Modal,
} from '@/components/ui';

interface Worker {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  hourly_rate: number;
  active: boolean;
  user_id: string | null;
}

interface UserAccount {
  id: string;
  username: string;
  role: string;
}

export default function WorkersPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleInput, setRoleInput] = useState('Technicien');
  const [hourlyRate, setHourlyRate] = useState('1500.00');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [active, setActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWorkers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userRole && userRole !== 'technician') {
      fetchWorkers();
      fetchUsers();
    }
  }, [userRole]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFullName('');
    setPhone('');
    setRoleInput('Technicien');
    setHourlyRate('1500.00');
    setLinkedUserId('');
    setActive(true);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (w: Worker) => {
    setIsEditing(true);
    setSelectedWorkerId(w.id);
    setFullName(w.full_name);
    setPhone(w.phone || '');
    setRoleInput(w.role);
    setHourlyRate(w.hourly_rate.toString());
    setLinkedUserId(w.user_id || '');
    setActive(w.active);
    setFormError('');
    setShowModal(true);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    const payload = {
      full_name: fullName,
      phone: phone || null,
      role: roleInput,
      hourly_rate: parseFloat(hourlyRate) || 0,
      user_id: linkedUserId || null,
      active,
    };

    try {
      const url = isEditing ? `/api/workers/${selectedWorkerId}` : '/api/workers';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la sauvegarde');
      } else {
        setShowModal(false);
        fetchWorkers();
      }
    } catch (err) {
      setFormError('Erreur de communication avec le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (userRole === 'technician') {
    return (
      <div className="text-danger p-8 text-center bg-surface-raised border border-danger/20 rounded-2xl max-w-xl mx-auto space-y-2">
        <h3 className="font-bold">Accès Restreint</h3>
        <p className="text-xs text-text-muted">
          La gestion des techniciens et des taux horaires est réservée aux responsables d&apos;atelier.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Équipe & Techniciens Atelier"
        subtitle="Gestion des collaborateurs, des qualifications et des assignations sur les ordres de réparation"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Techniciens' },
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Nouveau Collaborateur
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <tr>
            <TableHead>Nom & Prénom</TableHead>
            <TableHead>Rôle & Spécialité</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead className="text-right">Taux Horaire</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={6} message="Chargement de l'équipe..." />
          ) : workers.length === 0 ? (
            <TableEmptyState
              colSpan={6}
              title="Aucun intervenant enregistré"
              description="Ajoutez des mécaniciens ou électriciens pour pouvoir les assigner aux interventions."
              action={
                <Button variant="primary" size="sm" onClick={handleOpenCreate}>
                  Ajouter un Premier Technicien
                </Button>
              }
            />
          ) : (
            workers.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-bold text-text-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-overlay border border-border-default flex items-center justify-center font-bold text-xs">
                      {w.full_name.charAt(0)}
                    </div>
                    <span>{w.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-text-secondary">{w.role}</TableCell>
                <TableCell className="font-mono text-text-muted">{w.phone || '—'}</TableCell>
                <TableCell className="text-right font-mono font-bold text-accent">
                  {w.hourly_rate?.toLocaleString()} DZD/h
                </TableCell>
                <TableCell>
                  <Badge variant={w.active ? 'success' : 'neutral'}>
                    {w.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(w)}>
                    Modifier
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Worker Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Modifier la Fiche Collaborateur' : 'Ajouter un Collaborateur'}
        description="Renseignez l'identité, le rôle atelier et les paramètres de facturation horaire."
      >
        <form onSubmit={handleSaveWorker} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label="Nom & Prénom"
            required
            placeholder="ex. Youcef Mansouri"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Téléphone"
              type="tel"
              placeholder="ex. 0661 23 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Rôle / Spécialité"
              required
              placeholder="ex. Électricien Auto, Chef d'Équipe"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Taux Horaire (DZD/h)"
              type="number"
              step="0.01"
              required
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />

            <Select
              label="Compte Utilisateur Lié (Optionnel)"
              value={linkedUserId}
              onChange={(e) => setLinkedUserId(e.target.value)}
            >
              <option value="">-- Aucun compte d&apos;accès --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-border-default bg-surface-base text-accent"
              />
              <span>Collaborateur actuellement en activité dans l&apos;atelier</span>
            </label>
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={submitting} className="flex-1">
              {isEditing ? 'Enregistrer les Modifications' : 'Créer la Fiche'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
