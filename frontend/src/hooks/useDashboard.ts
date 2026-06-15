import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from '../lib/api';
import type { DashboardSnapshot } from '../lib/types';

export function useDashboard(refreshMs = 10_000) {
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const snapshot = await getDashboard();
      setData(snapshot);
      setError('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar el dashboard.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), refreshMs);
    return () => window.clearInterval(interval);
  }, [refresh, refreshMs]);

  return { data, loading, error, refresh };
}
