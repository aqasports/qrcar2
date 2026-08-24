import React from 'react';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

export function Table({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border-subtle bg-surface-raised shadow-xl shadow-black/20">
      <table className={`w-full text-left border-collapse text-xs sm:text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-surface-base/60 border-b border-border-subtle text-text-muted text-[11px] font-bold uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-border-subtle text-text-secondary ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`hover:bg-surface-overlay/50 transition-colors duration-100 group ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = '',
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3.5 font-bold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = '',
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3.5 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

export function TableLoadingState({
  colSpan = 5,
  message = 'Chargement des données en cours...',
}: {
  colSpan?: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <Spinner size="md" />
          <p className="text-xs text-text-muted font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function TableEmptyState({
  colSpan = 5,
  title = 'Aucune donnée disponible',
  description = 'Aucun élément ne correspond aux filtres ou critères sélectionnés.',
  action,
}: {
  colSpan?: number;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center">
        <EmptyState title={title} description={description} action={action} />
      </td>
    </tr>
  );
}
