import { useCallback } from 'react';
import { getLeads } from '../lib/api';
import { useResource } from './useResource';

export function useLeads(status?: string) {
  const loader = useCallback(
    () => getLeads({ limit: 250, status }),
    [status],
  );
  return useResource(loader, []);
}
