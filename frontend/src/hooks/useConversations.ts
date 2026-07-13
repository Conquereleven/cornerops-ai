import { useCallback } from 'react';
import { getConversations } from '../lib/api';
import { useResource } from './useResource';

export function useConversations(filters: { status?: string; worker?: string; intent?: string } = {}) {
  const { status, worker, intent } = filters;
  const loader = useCallback(
    () => getConversations({ limit: 250, status, worker, intent }),
    [status, worker, intent],
  );
  return useResource(loader, []);
}
