export class PluginAPIError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export function isNotConnectedError(error: unknown): boolean {
    return error instanceof PluginAPIError && error.code === 'not_connected';
}

export function handlePluginApiError(
    error: unknown,
    onConnectionLost: () => void,
    onError: (message: string) => void,
): void {
    if (isNotConnectedError(error)) {
        onConnectionLost();
        return;
    }
    onError(formatPluginError(error));
}

export function formatPluginError(error: unknown): string {
    if (error instanceof PluginAPIError) {
        if (error.status === 401 || error.code === 'solidtime_unauthorized' || error.code === 'not_connected') {
            return 'Session expired. Reconnect in the Solidtime sidebar or run /solidtime connect <api_token>.';
        }
        return error.message;
    }
    return (error as Error).message || 'Request failed';
}
