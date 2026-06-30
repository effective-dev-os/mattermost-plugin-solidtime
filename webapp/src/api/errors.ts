import {errorMessages} from 'i18n/messages';
import type {IntlShape} from 'react-intl';

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
    intl: IntlShape,
): void {
    if (isNotConnectedError(error)) {
        onConnectionLost();
        return;
    }
    onError(formatPluginError(error, intl));
}

export function formatPluginError(error: unknown, intl: IntlShape): string {
    if (error instanceof PluginAPIError) {
        if (error.status === 401 || error.code === 'solidtime_unauthorized' || error.code === 'not_connected') {
            return intl.formatMessage(errorMessages.sessionExpired);
        }
        switch (error.code) {
        case 'unauthorized':
            return intl.formatMessage(errorMessages.unauthorized);
        case 'invalid_body':
            return intl.formatMessage(errorMessages.invalidBody);
        case 'connect_failed':
            return intl.formatMessage(errorMessages.connectFailed);
        default:
            return intl.formatMessage(errorMessages.requestFailed);
        }
    }
    return (error as Error).message || intl.formatMessage(errorMessages.requestFailed);
}
