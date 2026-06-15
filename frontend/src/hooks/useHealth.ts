import { useEffect, useState } from 'react';
import { getHealth } from '../lib/api';

export function useHealth() {
  const [connected, setConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const health = await getHealth();
        if (active) {
          setConnected(health.status === 'ok');
          setLatencyMs(health.latencyMs);
        }
      } catch {
        if (active) {
          setConnected(false);
          setLatencyMs(null);
        }
      }
    };
    void check();
    const interval = window.setInterval(() => void check(), 15_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { connected, latencyMs };
}
