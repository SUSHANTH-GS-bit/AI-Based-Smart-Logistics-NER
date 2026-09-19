import { useState, useEffect, useCallback } from 'react';

const QUEUE_STORAGE_KEY = 'ner_offline_sync_queue';

export function useOfflineSync(isOnline) {
  const [syncQueue, setSyncQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('14:32');

  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(syncQueue));
    } catch (e) {
      console.error('Failed to save offline queue', e);
    }
  }, [syncQueue]);

  const queueRecord = useCallback((item) => {
    const record = {
      client_record_id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...item,
    };
    setSyncQueue((prev) => [...prev, record]);
    return record;
  }, []);

  const triggerSync = useCallback(async () => {
    if (syncQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);

    // Simulate backend synchronization delay
    await new Promise((res) => setTimeout(res, 1800));

    setSyncQueue([]);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setIsSyncing(false);
  }, [syncQueue, isSyncing]);

  // Automatic synchronization when coming back online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0 && !isSyncing) {
      triggerSync();
    }
  }, [isOnline, syncQueue.length, isSyncing, triggerSync]);

  return {
    syncQueue,
    pendingCount: syncQueue.length,
    isSyncing,
    lastSyncTime,
    queueRecord,
    triggerSync,
  };
}
