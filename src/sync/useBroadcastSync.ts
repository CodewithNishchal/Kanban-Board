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
      if (e.data.tabId === TAB_ID) return; // must be line 1, no exceptions
      applyRemoteAction(e.data.event);
    };

    return () => {
      channel.close();
    };
  }, [applyRemoteAction]);
}
