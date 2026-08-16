import RNEventSource from 'react-native-sse';

type SSEListener = (event: any) => void;

/** RN n'a pas d'EventSource, et react-native-sse n'expose pas les `onerror`/`onmessage` que le SDK assigne. */
class EventSourceAdapter {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;

  readonly url: string;
  readyState = EventSourceAdapter.CONNECTING;

  onopen: SSEListener | null = null;
  onmessage: SSEListener | null = null;
  onerror: SSEListener | null = null;

  private readonly source: RNEventSource<string>;

  constructor(url: string) {
    this.url = url;
    this.source = new RNEventSource<string>(url, {
      // La reconnexion est du ressort de PocketBase, via onerror.
      pollingInterval: 0,
      timeoutBeforeConnection: 0,
    });

    this.source.addEventListener('open', (event) => {
      this.readyState = EventSourceAdapter.OPEN;
      this.onopen?.(event);
    });
    this.source.addEventListener('message', (event) => this.onmessage?.(event));
    this.source.addEventListener('error', (event) => {
      this.readyState = EventSourceAdapter.CLOSED;
      this.onerror?.(event);
    });
  }

  addEventListener(type: string, listener: SSEListener): void {
    this.source.addEventListener(type as never, listener as never);
  }

  removeEventListener(type: string, listener: SSEListener): void {
    this.source.removeEventListener(type as never, listener as never);
  }

  close(): void {
    this.readyState = EventSourceAdapter.CLOSED;
    this.source.removeAllEventListeners();
    this.source.close();
  }
}

export function installEventSourcePolyfill(): void {
  const scope = globalThis as { EventSource?: unknown };
  if (!scope.EventSource) {
    scope.EventSource = EventSourceAdapter;
  }
}
