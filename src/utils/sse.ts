export interface SSEOptions {
  url: string;
  params?: Record<string, string | number>;
  onMessage?: (data: string, event?: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onError?: (event: Event) => void;
  onClose?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  eventNames?: string[];
}

export interface SSEConnection {
  close: () => void;
  getEventSource: () => EventSource | null;
}

class PureSSE {
  private baseURL = import.meta.env.VITE_APP_BASE_API || "";

  private buildUrl(url: string, params?: Record<string, string | number>) {
    const fullUrl = url.startsWith("http") ? url : `${this.baseURL}${url}`;
    const urlObj = new URL(fullUrl, window.location.origin);
    Object.entries(params || {}).forEach(([key, value]) => {
      urlObj.searchParams.set(key, String(value));
    });
    return urlObj.toString();
  }

  connect(options: SSEOptions): SSEConnection {
    const {
      url,
      params,
      onMessage,
      onOpen,
      onError,
      onClose,
      autoReconnect = true,
      reconnectInterval = 3000,
      maxReconnectAttempts = 5,
      eventNames = []
    } = options;
    let eventSource: EventSource | null = null;
    let reconnectCount = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let manuallyClosed = false;

    const connect = () => {
      if (manuallyClosed) return;
      eventSource = new EventSource(this.buildUrl(url, params));
      eventSource.onopen = event => {
        reconnectCount = 0;
        onOpen?.(event);
      };
      eventSource.onmessage = event => onMessage?.(event.data, event);
      eventNames.forEach(name => {
        eventSource?.addEventListener(name, event => {
          onMessage?.((event as MessageEvent).data, event as MessageEvent);
        });
      });
      eventSource.onerror = event => {
        onError?.(event);
        if (eventSource?.readyState !== EventSource.CLOSED) return;
        eventSource.close();
        eventSource = null;
        onClose?.();
        if (
          autoReconnect &&
          !manuallyClosed &&
          (maxReconnectAttempts === -1 || reconnectCount < maxReconnectAttempts)
        ) {
          reconnectCount += 1;
          reconnectTimer = setTimeout(connect, reconnectInterval);
        }
      };
    };

    const close = () => {
      manuallyClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = null;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
        onClose?.();
      }
    };

    connect();
    return { close, getEventSource: () => eventSource };
  }
}

export const sse = new PureSSE();
