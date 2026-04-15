import { useState, useEffect, useCallback } from 'react';

export function useExchangeRate() {
  const [rate,        setRate]        = useState(null);   // ARS por 1 USD (venta)
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadRate = useCallback(async () => {
    try {
      const res  = await fetch('/api/dolar/v1/dolares/oficial');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      // dolarapi.com devuelve { venta: número }
      if (data?.venta) {
        setRate(data.venta);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('Exchange rate fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const safeLoad = () => { if (alive) loadRate(); };
    safeLoad();
    const id = setInterval(safeLoad, 5 * 60 * 1000); // cada 5 min
    return () => { alive = false; clearInterval(id); };
  }, [loadRate]);

  /** Convierte ARS a USD y formatea como "1.23" */
  const toUSD = useCallback(
    (ars) => {
      if (!rate || !ars) return null;
      return (ars / rate).toFixed(2);
    },
    [rate]
  );

  return { rate, loading, lastUpdated, toUSD };
}
