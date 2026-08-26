'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from './Table';
import { SkeletonTable } from './Skeleton';
import { SearchInput } from './SearchInput';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  bulkActions?: (selectedKeys: string[]) => React.ReactNode;
  pageSize?: number;
  showPagination?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyTitle = 'Aucun élément trouvé',
  emptyDescription = 'Aucune donnée disponible pour le moment.',
  emptyAction,
  searchable = true,
  searchPlaceholder = 'Filtrer les lignes...',
  searchFilter,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  bulkActions,
  pageSize = 15,
  showPagination = true,
  className = '',
  onRowClick,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    if (searchFilter) {
      return data.filter((row) => searchFilter(row, searchQuery.toLowerCase()));
    }

    return data.filter((row) =>
      Object.values(row as Record<string, unknown>).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, searchFilter]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = (a as Record<string, unknown>)[sortKey];
      const valB = (b as Record<string, unknown>)[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Paginate Data
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage, showPagination]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedKeys.includes(keyExtractor(row)));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      const pageKeys = new Set(paginatedData.map(keyExtractor));
      onSelectionChange(selectedKeys.filter((k) => !pageKeys.has(k)));
    } else {
      const newKeys = new Set([...selectedKeys, ...paginatedData.map(keyExtractor)]);
      onSelectionChange(Array.from(newKeys));
    }
  };

  const handleRowSelect = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  };

  if (loading) {
    return <SkeletonTable rows={rowsPerPage > 8 ? 8 : rowsPerPage} cols={columns.length + (selectable ? 1 : 0)} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Toolbar: Search & Bulk Actions */}
      {(searchable || (selectable && selectedKeys.length > 0)) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {searchable && (
            <div className="w-full sm:w-72">
              <SearchInput
                value={searchQuery}
                onChange={(q) => {
                  setSearchQuery(q);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
              />
            </div>
          )}

          {selectable && selectedKeys.length > 0 && (
            <div className="flex items-center gap-2 bg-surface-raised px-3 py-1.5 rounded-xl border border-border-default animate-in fade-in zoom-in-95 duration-150">
              <span className="text-xs font-semibold text-accent font-mono">
                {selectedKeys.length} sélectionné{selectedKeys.length > 1 ? 's' : ''}
              </span>
              {bulkActions && <div>{bulkActions(selectedKeys)}</div>}
            </div>
          )}
        </div>
      )}

      {/* Main Table Container */}
      <Table>
        <TableHeader>
          <tr>
            {selectable && (
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-border-default bg-surface-base text-accent focus:ring-accent/20 cursor-pointer"
                  aria-label="Tout sélectionner"
                />
              </TableHead>
            )}
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const alignClass =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';

              return (
                <TableHead
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`${alignClass} ${col.className || ''}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1.5 group font-bold hover:text-text-primary transition-colors select-none"
                    >
                      <span>{col.header}</span>
                      <span className="flex flex-col text-text-muted group-hover:text-text-primary">
                        <svg
                          className={`w-3 h-3 transition-colors ${
                            isSorted && sortDirection === 'asc'
                              ? 'text-accent'
                              : isSorted && sortDirection === 'desc'
                              ? 'text-accent rotate-180'
                              : 'opacity-40 group-hover:opacity-100'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </tr>
        </TableHeader>

        <TableBody>
          {paginatedData.length === 0 ? (
            <TableEmptyState
              colSpan={columns.length + (selectable ? 1 : 0)}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyAction}
            />
          ) : (
            paginatedData.map((row, rIdx) => {
              const rowKey = keyExtractor(row);
              const isSelected = selectedKeys.includes(rowKey);

              return (
                <TableRow
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`${onRowClick ? 'cursor-pointer' : ''} ${
                    isSelected ? 'bg-accent/5' : ''
                  }`}
                >
                  {selectable && (
                    <TableCell className="w-10 text-center" onClick={(e) => handleRowSelect(rowKey, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-border-default bg-surface-base text-accent focus:ring-accent/20 cursor-pointer"
                        aria-label={`Sélectionner la ligne ${rowKey}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    return (
                      <TableCell key={col.key} className={`${alignClass} ${col.className || ''}`}>
                        {col.render ? col.render(row, rIdx) : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      {showPagination && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span>Afficher</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface-base border border-border-default rounded-lg px-2 py-1 text-xs text-text-primary outline-none focus:border-accent font-mono"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>lignes sur <span className="font-mono font-bold text-text-primary">{sortedData.length}</span></span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border-default text-text-primary disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-hover transition-colors"
            >
              ← Précédent
            </button>
            <span className="px-2 font-mono">
              Page <strong className="text-text-primary">{currentPage}</strong> sur <strong className="text-text-primary">{totalPages}</strong>
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border-default text-text-primary disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-hover transition-colors"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
