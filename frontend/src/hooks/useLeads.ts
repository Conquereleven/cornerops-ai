import { useCallback } from 'react';
import { getLeads } from '../lib/api';
import { mockLeads } from '../lib/mockData';
import { useResource } from './useResource';

export function useLeads(status?: string) {
  const loader = useCallback(
    () => getLeads({ limit: 250, status }),
    [status],
  );
  return useResource(loader, mockLeads);
}
