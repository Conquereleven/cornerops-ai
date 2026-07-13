import { useCallback } from 'react';
import { getProducts } from '../lib/api';
import { useResource } from './useResource';

export function useProducts(filters: { category?: string; b2bAvailable?: boolean; lowStock?: boolean } = {}) {
  const { category, b2bAvailable, lowStock } = filters;
  const loader = useCallback(
    () => getProducts({ limit: 500, category, b2bAvailable, lowStock }),
    [category, b2bAvailable, lowStock],
  );
  return useResource(loader, []);
}
