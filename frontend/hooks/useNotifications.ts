import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getValidAccessToken } from '../lib/auth';

export type NotificationEventType = 'taskCreated' | 'taskCompleted' | 'meetingCreated';

export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  payload?: Record<string, unknown>;
};

const EVENTS: NotificationEventType[] = ['taskCreated', 'taskCompleted', 'meetingCreated'];
const LAST_EVENT_ID_KEY = 'lastNotificationEventId';

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || '';
}

function parseNotification(message: MessageEvent): NotificationItem | null {
  try {
    const data = JSON.parse(message.data || '{}');
    return {
      id: String(data.id || message.lastEventId || `${data.type || message.type}:${Date.now()}`),
      type: String(data.type || message.type || 'notification'),
      message: String(data.message || 'Workspace notification'),
      timestamp: String(data.timestamp || new Date().toISOString()),
      payload: data.payload && typeof data.payload === 'object' ? data.payload : undefined,
      read: false
    };
  } catch {
    return null;
  }
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const addNotification = useCallback((item: NotificationItem | null) => {
    if (!item) return;
    if (typeof window !== 'undefined') localStorage.setItem(LAST_EVENT_ID_KEY, item.id);
    setItems((prev) => {
      if (prev.some((existing) => existing.id === item.id)) return prev;
      return [item, ...prev].slice(0, 30);
    });
    setToast(item);
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    sourceRef.current?.close();
    sourceRef.current = null;
    setConnected(false);
  }, []);

  const connect = useCallback(async () => {
    if (sourceRef.current || typeof window === 'undefined') return;

    const token = await getValidAccessToken();
    if (!token) return;

    const params = new URLSearchParams({ token });
    const lastEventId = localStorage.getItem(LAST_EVENT_ID_KEY);
    if (lastEventId) params.set('lastEventId', lastEventId);

    const source = new EventSource(`${getApiBase()}/api/notifications/subscribe?${params.toString()}`);
    sourceRef.current = source;

    source.addEventListener('connected', () => {
      retryCountRef.current = 0;
      setConnected(true);
    });

    source.addEventListener('heartbeat', () => {
      setConnected(true);
    });

    EVENTS.forEach((eventName) => {
      source.addEventListener(eventName, (event) => {
        setConnected(true);
        addNotification(parseNotification(event as MessageEvent));
      });
    });

    source.onerror = () => {
      source.close();
      sourceRef.current = null;
      setConnected(false);

      const delay = Math.min(30000, 1000 * 2 ** retryCountRef.current);
      retryCountRef.current += 1;
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };
  }, [addNotification]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return {
    items,
    connected,
    toast,
    unreadCount,
    markAllRead,
    reconnect: connect,
    disconnect
  };
}
