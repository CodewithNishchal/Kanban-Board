import { useEffect, useState } from 'react';
import { useBoardStore } from '../store/boardStore';
import type { SyncMessage } from '../types';
import { TAB_ID } from './tabId';

export { TAB_ID };

// Shared channel instance for presence
const presenceChannel = new BroadcastChannel('kanban-presence');

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
      if (e.data.tabId === TAB_ID) return; // must be line 1, no exceptions
      applyRemoteAction(e.data.event);
    };

    return () => {
      channel.close();
    };
  }, [applyRemoteAction]);
}

export function useActiveTabs() {
  const [activeTabs, setActiveTabs] = useState<Set<string>>(new Set([TAB_ID]));

  useEffect(() => {
    const activeIds = new Map<string, number>();
    activeIds.set(TAB_ID, Date.now());

    presenceChannel.onmessage = (e) => {
      if (e.data.type === 'PING') {
        activeIds.set(e.data.tabId, Date.now());
        // Echo back a PONG so the new tab knows about us
        presenceChannel.postMessage({ type: 'PONG', tabId: TAB_ID });
      } else if (e.data.type === 'PONG') {
        activeIds.set(e.data.tabId, Date.now());
      } else if (e.data.type === 'LEAVE') {
        activeIds.delete(e.data.tabId);
      }
      setActiveTabs(new Set(activeIds.keys()));
    };

    // Announce presence
    presenceChannel.postMessage({ type: 'PING', tabId: TAB_ID });

    // Periodic heartbeat to clean up dead tabs
    const heartbeat = setInterval(() => {
      presenceChannel.postMessage({ type: 'PING', tabId: TAB_ID });
      const now = Date.now();
      let changed = false;
      activeIds.forEach((lastSeen, id) => {
        if (id !== TAB_ID && now - lastSeen > 4000) {
          activeIds.delete(id);
          changed = true;
        }
      });
      if (changed) setActiveTabs(new Set(activeIds.keys()));
    }, 2000);

    const handleUnload = () => {
      presenceChannel.postMessage({ type: 'LEAVE', tabId: TAB_ID });
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return activeTabs.size;
}
