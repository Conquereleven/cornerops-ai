import { useMemo, useState } from 'react';
import { DataTable } from '../components/tables/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../lib/types';
import { ResourcePage } from './Conversations';

export function Products() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [availability, setAvailability] = useState('all');
  const { data, loading, offline, error, refresh } = useProducts({
    category: category === 'all' ? undefined : category,
    b2bAvailable: availability === 'b2b' ? true : undefined,
    lowStock: availability === 'low' ? true : undefined,
  });
  const rows = useMemo(() => data.filter((item) =>
    `${item.sku} ${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())
  ), [data, query]);
  const categories = Array.from(new Set([...data.map((item) => item.category), category])).filter((value) => value && value !== 'all');
  return <ResourcePage title="Products" subtitle="Catálogo persistente, precios AED e inventario." loading={loading} offline={offline} error={error} onRetry={() => void refresh()} search={query} setSearch={setQuery} actions={<><select aria-label="Filtrar por categoría" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas las categorías</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filtrar por disponibilidad" value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">Todo el inventario</option><option value="b2b">Disponible B2B</option><option value="low">Stock bajo</option></select></>}><DataTable<Product> rows={rows} keyFor={(row) => row.sku} empty={loading ? 'Cargando productos…' : 'No hay productos para estos filtros.'} columns={[
    { label: 'SKU', render: (row) => <code>{row.sku}</code> },
    { label: 'Producto', render: (row) => <span className="cell-primary">{row.name}</span> },
    { label: 'Categoría', render: (row) => row.category },
    { label: 'Precio AED', render: (row) => <strong>{row.priceAED} AED</strong> },
    { label: 'Stock', render: (row) => <StatusBadge tone={row.stock < 20 ? 'amber' : 'green'}>{row.stock} uds</StatusBadge> },
    { label: 'B2B', render: (row) => row.b2bAvailable ? 'Disponible' : 'No' },
    { label: 'Idiomas', render: (row) => row.languages.join(' / ').toUpperCase() },
  ]} /></ResourcePage>;
}
