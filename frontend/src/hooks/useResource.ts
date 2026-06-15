import { useCallback, useEffect, useState } from 'react';

export function useResource<T>(loader: () => Promise<T>, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loader());
      setOffline(false);
      setError('');
    } catch (requestError) {
      setData(fallback);
      setOffline(true);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar los datos.',
      );
    } finally {
      setLoading(false);
    }
  }, [loader, fallback]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, loading, offline, error, refresh };
}
