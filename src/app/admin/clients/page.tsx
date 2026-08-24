'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Modal,
  Button,
  Input,
  Textarea,
} from '@/components/ui';

interface Client {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New client form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setClients(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(search);
  }, [search]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email: email || null,
          address: address || null,
          notes: notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la création du client');
      } else {
        setShowModal(false);
        setFullName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setNotes('');
        fetchClients(search);
      }
    } catch (err) {
      setFormError('Erreur de communication avec le serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="Répertoire Clients"
        subtitle="Gestion des propriétaires de véhicules, coordonnées et historiques de contact"
        breadcrumbs={[
          { label: 'Tableau de bord', href: '/admin' },
          { label: 'Clients' },
        ]}
        actions={
          role !== 'technician' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormError('');
                setShowModal(true);
              }}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nouveau Client
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <Input
            placeholder="Rechercher par nom, téléphone, adresse..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Table */}
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Nom & Prénom</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead className="text-right">Fiche Client</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableLoadingState colSpan={5} message="Chargement des clients..." />
          ) : clients.length === 0 ? (
            <TableEmptyState
              colSpan={5}
              title="Aucun client enregistré"
              description="Aucun client ne correspond aux critères de recherche."
              action={
                role !== 'technician' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setFormError('');
                      setShowModal(true);
                    }}
                  >
                    Ajouter un Premier Client
                  </Button>
                ) : null
              }
            />
          ) : (
            clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-bold text-text-primary">
                  {c.full_name}
                </TableCell>
                <TableCell className="font-mono text-text-secondary">
                  {c.phone}
                </TableCell>
                <TableCell className="text-text-muted">
                  {c.email || '—'}
                </TableCell>
                <TableCell className="text-text-muted max-w-xs truncate">
                  {c.address || '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="inline-flex items-center text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                  >
                    Voir Dossier
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* New Client Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nouveau Client Propriétaire"
        description="Enregistrez un nouveau contact pour lui associer des véhicules et ordres de réparation."
      >
        <form onSubmit={handleCreateClient} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label="Nom & Prénom"
            required
            placeholder="ex. Karim Benali"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Numéro de Téléphone"
            required
            type="tel"
            placeholder="ex. 0550 12 34 56"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Adresse Email (Optionnel)"
            type="email"
            placeholder="ex. karim@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Adresse & Commune (Optionnel)"
            placeholder="ex. Bab Ezzouar, Alger"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Textarea
            label="Remarques & Préférences (Optionnel)"
            rows={2}
            placeholder="Disponibilités, informations particulières..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-2.5 pt-3">
            <Button type="submit" isLoading={submitting} className="flex-1">
              Enregistrer le Client
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
