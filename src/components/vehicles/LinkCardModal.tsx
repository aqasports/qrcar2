import React from 'react';
import { Modal, Button, Select } from '@/components/ui';

interface PVC_Card {
  id: string;
  token: string;
  serial_label: string;
}

interface LinkCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  unassignedCards: PVC_Card[];
  selectedCardToken: string;
  onSelectToken: (token: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLinking: boolean;
  error: string;
}

export function LinkCardModal({
  isOpen,
  onClose,
  unassignedCards,
  selectedCardToken,
  onSelectToken,
  onSubmit,
  isLinking,
  error,
}: LinkCardModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Associer une Carte PVC Physique"
      description="Sélectionnez une carte PVC pré-encodée disponible dans votre stock pour la lier à ce véhicule."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-xs">
            {error}
          </div>
        )}

        <Select
          label="Carte PVC Vierge Disponible"
          required
          value={selectedCardToken}
          onChange={(e) => onSelectToken(e.target.value)}
        >
          <option value="">-- Sélectionner une carte PVC en stock --</option>
          {unassignedCards.map((card) => (
            <option key={card.id} value={card.token}>
              {card.serial_label} (ID: {card.token.slice(0, 8)}...)
            </option>
          ))}
        </Select>

        <div className="flex gap-2.5 pt-3">
          <Button type="submit" isLoading={isLinking} className="flex-1">
            Lier la Carte au Véhicule
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
}
