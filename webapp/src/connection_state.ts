type Listener = (connected: boolean) => void;

let connected = false;
const listeners = new Set<Listener>();

export function getConnectionState(): boolean {
    return connected;
}

export function setConnectionState(value: boolean): void {
    connected = value;
    listeners.forEach((listener) => listener(value));
}

export function subscribeConnectionState(listener: Listener): () => void {
    listeners.add(listener);
    listener(connected);
    return () => listeners.delete(listener);
}
