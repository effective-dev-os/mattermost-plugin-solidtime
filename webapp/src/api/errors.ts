export class PluginAPIError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export function formatPluginError(error: unknown): string {
    if (error instanceof PluginAPIError) {
        if (error.status === 401 || error.code === 'solidtime_unauthorized' || error.code === 'not_connected') {
            return 'Session expired. Run /solidtime connect <api_token> to reconnect.';
        }
        return error.message;
    }
    return (error as Error).message || 'Request failed';
}
