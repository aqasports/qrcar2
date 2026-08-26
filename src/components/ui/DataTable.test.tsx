import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DataTable, ColumnDef } from './DataTable';

interface TestItem {
  id: string;
  name: string;
  count: number;
}

describe('DataTable UI Component', () => {
  const sampleData: TestItem[] = [
    { id: '1', name: 'Filtre à huile', count: 15 },
    { id: '2', name: 'Plaquettes de frein', count: 4 },
    { id: '3', name: 'Bougies d’allumage', count: 20 },
  ];

  const columns: ColumnDef<TestItem>[] = [
    { key: 'name', header: 'Nom Pièce', sortable: true },
    { key: 'count', header: 'Quantité', sortable: true },
  ];

  it('renders data rows and column headers', () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByText('Filtre à huile')).toBeInTheDocument();
    expect(screen.getByText('Plaquettes de frein')).toBeInTheDocument();
    expect(screen.getByText('Bougies d’allumage')).toBeInTheDocument();
  });

  it('filters data when typing in search input', () => {
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Rechercher..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    fireEvent.change(searchInput, { target: { value: 'frein' } });

    expect(screen.getByText('Plaquettes de frein')).toBeInTheDocument();
    expect(screen.queryByText('Filtre à huile')).not.toBeInTheDocument();
  });

  it('handles row click callback', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={sampleData}
        keyExtractor={(item) => item.id}
        onRowClick={onRowClick}
      />
    );

    const row = screen.getByText('Filtre à huile');
    fireEvent.click(row);

    expect(onRowClick).toHaveBeenCalledWith(sampleData[0]);
  });
});
