import type { ReactNode } from 'react';

export interface Column<T> { label: string; render: (row: T) => ReactNode; }

export function DataTable<T>({ rows, columns, keyFor, empty = 'No hay datos disponibles.' }: { rows: T[]; columns: Column<T>[]; keyFor: (row: T) => string; empty?: string }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={keyFor(row)}>{columns.map((column) => <td key={column.label}>{column.render(row)}</td>)}</tr>)}{!rows.length && <tr><td colSpan={columns.length} className="empty-cell">{empty}</td></tr>}</tbody></table></div>;
}
