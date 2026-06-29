type Listener = (connected: boolean) => void;

const listeners = new Set<Listener>();

export function setConnectionState(connected: boolean): void {
    listeners.forEach((listener) => listener(connected));
}

export function subscribeConnectionState(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
