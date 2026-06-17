import { useState, useEffect } from 'react';

export function useRelativeTimeRefresh(intervalMs = 30000) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return tick; // Changing value triggers re-render when used in a component
}
