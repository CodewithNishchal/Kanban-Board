# Phase 4: BroadcastChannel Sync & Tab Registry

## 🎯 Objectives
* Implement the core synchronization logic in `src/sync/useBroadcastSync.ts`.
* Wire the Zustand store directly to the `BroadcastChannel` instance to transmit local updates.
* Safeguard against echo loops using the stable, session-bound `TAB_ID` header matching.
* Create a lightweight active tab registry in `src/sync/useTabRegistry.ts` using heartbeats to calculate connected counts.

---

## 💻 Technical Checklist

### 1. The Sync Hook (`src/sync/useBroadcastSync.ts`)
Creates the `'kanban-board'` channel and coordinates messaging.

```typescript
import { useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { SyncMessage } from '../types';

export const TAB_ID = crypto.randomUUID(); // unique session tab ID

export function useBroadcastSync() {
  const applyRemoteAction = useBoardStore((s) => s.applyRemoteAction);

  useEffect(() => {
    const channel = new BroadcastChannel('kanban-board');

    // Wire store's internal broadcaster helper to send events over this channel
    useBoardStore.setState({
      _broadcastAction: (event) => {
        const message: SyncMessage = { tabId: TAB_ID, event };
        channel.postMessage(message);
      },
    });

    // Handle incoming channel messages
    channel.onmessage = (e: MessageEvent<SyncMessage>) => {
      const { tabId, event } = e.data;
      if (tabId === TAB_ID) return; // Echo guard: discard our own event

      // Apply changes directly to local React state via Zustand (no localStorage reloads)
      applyRemoteAction(event);
    };

    return () => {
      channel.close();
    };
  }, [applyRemoteAction]);
}
```

### 2. The Tab Registry Hook (`src/sync/useTabRegistry.ts`)
To count active tabs without a backend:
* Maintain a local `Map<string, number>` in React state storing `{ tabId: lastSeenTimestamp }`.
* Create a secondary channel named `'kanban-tabs'`.
* Every 1.5 seconds, the tab broadcasts a ping containing its `TAB_ID`.
* When receiving a ping, register the tab in the local map and update timestamps.
* Periodically sweep the registry: evict any tab that has not sent a ping for over 3 seconds.
* Expose the size of the active registry map as `tabCount` to display in the top bar.

```typescript
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
    const pingInterval = setInterval(ping, 1000);

    // Eviction check loop
    const sweepInterval = setInterval(() => {
      const now = Date.now();
      setActiveTabs((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const [id, lastSeen] of next.entries()) {
          if (now - lastSeen > 2500 && id !== myId) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(sweepInterval);
      channel.close();
    };
  }, []);

  // Include self in the count
  return activeTabs.size || 1;
}
```
---

## 🚀 Late-Joining Tab Handling
When a brand new tab opens, it reads the initial state from `localStorage` (which holds the latest updates written by open tabs). All successive mutations are received in real-time over the `BroadcastChannel`. This guarantees perfect consistency without complex synchronization steps.
