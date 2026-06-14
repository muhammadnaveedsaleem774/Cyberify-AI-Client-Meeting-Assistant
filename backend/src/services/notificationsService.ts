import { EventEmitter } from 'events';
import { Response } from 'express';
import crypto from 'crypto';

export type NotificationEventType = 'taskCreated' | 'taskCompleted' | 'meetingCreated' | string;

export type NotificationEnvelope = {
  id: string;
  type: NotificationEventType;
  message: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

type NotifyOptions = {
  excludeUserId?: string;
};

type SSEClient = {
  id: string;
  userId: string;
  res: Response;
  heartbeat: NodeJS.Timeout;
};

const emitter = new EventEmitter();
const clients: Map<string, Map<string, Set<SSEClient>>> = new Map();
const history: Map<string, NotificationEnvelope[]> = new Map();
const MAX_HISTORY_PER_WORKSPACE = 100;

function writeEvent(res: Response, event: string, data: unknown, id?: string) {
  if (id) res.write(`id: ${id}\n`);
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function storeEvent(workspaceId: string, event: NotificationEnvelope) {
  const events = history.get(workspaceId) || [];
  events.push(event);
  history.set(workspaceId, events.slice(-MAX_HISTORY_PER_WORKSPACE));
}

function replayMissedEvents(workspaceId: string, userId: string, lastEventId: string | undefined, res: Response) {
  if (!lastEventId) return;
  const events = history.get(workspaceId) || [];
  const lastIndex = events.findIndex((event) => event.id === lastEventId);
  const missed = lastIndex >= 0 ? events.slice(lastIndex + 1) : events.slice(-20);
  for (const event of missed) {
    if (event.payload.actorUserId && String(event.payload.actorUserId) === userId) continue;
    writeEvent(res, event.type, event, event.id);
  }
}

export function subscribe(workspaceId: string, userId: string, res: Response, lastEventId?: string) {
  const workspaceClients = clients.get(workspaceId) || new Map<string, Set<SSEClient>>();
  const userClients = workspaceClients.get(userId) || new Set<SSEClient>();
  const heartbeat = setInterval(() => {
    try {
      writeEvent(res, 'heartbeat', { timestamp: Date.now() });
    } catch {}
  }, 30000);
  const client = { id: crypto.randomUUID(), userId, res, heartbeat };
  userClients.add(client);
  workspaceClients.set(userId, userClients);
  clients.set(workspaceId, workspaceClients);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 5000\n\n');
  writeEvent(res, 'connected', { connected: true, clientId: client.id, timestamp: Date.now() });
  replayMissedEvents(workspaceId, userId, lastEventId, res);

  res.on('close', () => {
    clearInterval(client.heartbeat);
    userClients.delete(client);
    if (userClients.size === 0) workspaceClients.delete(userId);
    if (workspaceClients.size === 0) clients.delete(workspaceId);
  });
}

export function notify(workspaceId: string, type: NotificationEventType, payload: Record<string, unknown>, message?: string, options: NotifyOptions = {}) {
  const event: NotificationEnvelope = {
    id: crypto.randomUUID(),
    type,
    message: message || String(payload.message || type),
    timestamp: new Date().toISOString(),
    payload
  };
  storeEvent(workspaceId, event);
  emitter.emit(type, event);

  const workspaceClients = clients.get(workspaceId);
  if (!workspaceClients) return;
  for (const [userId, userClients] of workspaceClients.entries()) {
    if (options.excludeUserId && userId === options.excludeUserId) continue;
    for (const client of userClients) {
      try {
        writeEvent(client.res, type, event, event.id);
      } catch {}
    }
  }
}

export default { subscribe, notify, emitter };
