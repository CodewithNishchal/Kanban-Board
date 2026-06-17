import { useState, useEffect } from 'react';
import { TAB_ID } from './useBroadcastSync';

export function useTabRegistry() {
  const [activeTabs, setActiveTabs] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const channel = new BroadcastChannel('kanban-tabs');
    const myId = TAB_ID;

    const ping = () => {
      channel.postMessage({ type: 'PING', tabId: myId });
    };

    channel.onmessage = (e) => {
      if (e.data.type === 'PING') {
        setActiveTabs((prev) => {
          const next = new Map(prev);
          next.set(e.data.tabId, Date.now());
          return next;
        });
      }
    };

    // Initial ping & interval
    ping();
    const pingInterval = setInterval(ping, 2000);

    // Eviction check loop
    const sweepInterval = setInterval(() => {
      const now = Date.now();
      setActiveTabs((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [id, lastSeen] of next.entries()) {
          if (now - lastSeen > 5000 && id !== myId) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 2000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(sweepInterval);
      channel.close();
    };
  }, []);

  // Include self in the count
  return activeTabs.size || 1;
}
