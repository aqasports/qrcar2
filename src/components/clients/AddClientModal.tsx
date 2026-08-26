'use client';

import React, { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { useToast } from '@/lib/hooks/useToast';
import { useI18n } from '@/lib/i18n/I18nProvider';

export interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

export function AddClientModal({
  isOpen,
  onClose,
  onClientCreated,
}: AddClientModalProps) {
  const { toast } = useToast();
  const { t } = useI18n();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    if (!fullName.trim() || !phone.trim()) {
      setFormError('Le nom complet et le numéro de téléphone sont obligatoires.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création du client.');
      }

      toast.success('Client enregistré avec succès dans le répertoire.');
      resetForm();
      onClose();
      onClientCreated();
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Erreur de communication avec le serveur.';
      setFormError(errorText);
      toast.error(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.clients.addClient}
      description={t.clients.subtitle}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={submitting}
          >
            {t.common.save}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">
            {formError}
          </div>
        )}

        <Input
          label={t.clients.fullName}
          required
          placeholder="Ex: Karim Benali"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          label={t.clients.phone}
          required
          type="tel"
          placeholder="Ex: 0550 12 34 56"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <Input
          label={t.clients.email}
          type="email"
          placeholder="Ex: client@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label={t.clients.address}
          placeholder="Ex: Bab Ezzouar, Alger"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <Textarea
          label={t.actions.internalNotes}
          placeholder="Remarques particulières, préférences client, historique..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </form>
    </Modal>
  );
}
