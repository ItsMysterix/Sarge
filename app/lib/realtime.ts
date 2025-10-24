"use client";

// Lightweight realtime connection watcher with reconnect/backoff and online awareness.
// Note: tRPC already uses a WebSocket; this helper focuses on connection status and UX hooks.

type ConnectOpts = {
  getUrl?: () => string;
  onOpen?: () => void;
  onClose?: (ev: CloseEvent) => void;
  onMessage?: (ev: MessageEvent) => void;
};

function defaultWsUrl(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_WS_URL || '';
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl && envUrl.length > 0) return envUrl;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/ws`;
}

export function connectWs(opts: ConnectOpts = {}): WebSocket {
  const getUrl = opts.getUrl ?? defaultWsUrl;
  let ws: WebSocket;
  let backoff = 1000; // 1s
  const maxBackoff = 30000; // 30s
  let closedByUser = false;
  let heartbeat: number | null = null;

  function scheduleReconnect() {
    if (closedByUser) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      // Wait for online
      const handler = () => {
        window.removeEventListener('online', handler);
        setTimeout(open, 0);
      };
      window.addEventListener('online', handler);
      return;
    }
    const jitter = Math.random() * 0.4 + 0.8; // 0.8x - 1.2x
    const delay = Math.min(maxBackoff, Math.floor(backoff * jitter));
    backoff = Math.min(maxBackoff, backoff * 2);
    setTimeout(open, delay);
  }

  function clearHeartbeat() {
    if (heartbeat != null) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  }

  function open() {
    try {
      ws = new WebSocket(getUrl());
    } catch (e) {
      scheduleReconnect();
      // @ts-ignore
      return ws;
    }
    ws.addEventListener('open', () => {
      backoff = 1000;
      opts.onOpen?.();
      clearHeartbeat();
      // Keep connection warm; server will ignore unknown payloads
      heartbeat = window.setInterval(() => {
        try { ws.send(JSON.stringify({ type: 'ping', t: Date.now() })); } catch {}
      }, 30000);
    });
    ws.addEventListener('close', (ev) => {
      clearHeartbeat();
      opts.onClose?.(ev);
      if (!closedByUser) scheduleReconnect();
    });
    if (opts.onMessage) ws.addEventListener('message', opts.onMessage);
    // @ts-ignore
    return ws;
  }

  const instance = open();
  // Monkey-patch close to stop reconnection
  const origClose = instance.close.bind(instance);
  instance.close = ((...args: any[]) => {
    closedByUser = true;
    clearHeartbeat();
    return origClose(...(args as [any]));
  }) as any;
  return instance;
}

export type SubscriptionToken = { unsubscribe: () => void };

// React-friendly wrappers can use tRPC hooks directly in components; these non-hook
// helpers are placeholders to keep a simple API surface for future expansion.
export function subscribeDeploy(_id: string | undefined, _handler: (ev: any) => void): SubscriptionToken {
  // Intentionally a no-op wrapper: use trpc.deploy.subscribe.useSubscription in components.
  return { unsubscribe() {} };
}

export function unsubscribe(token: SubscriptionToken) { token?.unsubscribe?.(); }
