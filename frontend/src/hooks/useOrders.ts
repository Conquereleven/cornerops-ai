import { useCallback } from 'react';
import { getOrders } from '../lib/api';
import { useResource } from './useResource';

export function useOrders(status?: string) {
  const loader = useCallback(
    () => getOrders({ limit: 250, status }),
    [status],
  );
  return useResource(loader, []);
}
