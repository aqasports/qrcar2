import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ToastItem, ToastMessage } from './Toast';

describe('Toast UI Component', () => {
  it('renders title, message, and variant icon', () => {
    const toast: ToastMessage = {
      id: 'test-1',
      title: 'Opération réussie',
      message: 'Véhicule enregistré dans le parc atelier.',
      variant: 'success',
      durationMs: 5000,
    };
    const onDismiss = vi.fn();

    render(<ToastItem toast={toast} onDismiss={onDismiss} />);

    expect(screen.getByText('Opération réussie')).toBeInTheDocument();
    expect(screen.getByText('Véhicule enregistré dans le parc atelier.')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', () => {
    const toast: ToastMessage = {
      id: 'test-2',
      message: 'Erreur de connexion',
      variant: 'error',
      durationMs: 0,
    };
    const onDismiss = vi.fn();

    render(<ToastItem toast={toast} onDismiss={onDismiss} />);
    const closeBtn = screen.getByTitle('Fermer');
    fireEvent.click(closeBtn);

    expect(onDismiss).toHaveBeenCalledWith('test-2');
  });
});
