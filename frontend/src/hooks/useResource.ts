import { useCallback, useEffect, useRef, useState } from 'react';

export function useResource<T>(loader: () => Promise<T>, emptyValue: T) {
  const emptyRef = useRef(emptyValue);
  const [data, setData] = useState<T>(emptyValue);
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
      setData(emptyRef.current);
      setOffline(true);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible cargar los datos.',
      );
    } finally {
      setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { data, loading, offline, error, refresh };
}
