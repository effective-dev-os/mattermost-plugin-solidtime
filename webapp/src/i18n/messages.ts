export const errorMessages = {
    sessionExpired: {
        id: 'solidtime.error.session_expired',
        defaultMessage: 'Session expired. Reconnect in the Solidtime sidebar or run /solidtime connect <api_token>.',
    },
    unauthorized: {
        id: 'solidtime.error.unauthorized',
        defaultMessage: 'Not authorized',
    },
    invalidBody: {
        id: 'solidtime.error.invalid_body',
        defaultMessage: 'Invalid request body',
    },
    connectFailed: {
        id: 'solidtime.error.connect_failed',
        defaultMessage: 'Failed to connect to Solidtime',
    },
    requestFailed: {
        id: 'solidtime.error.request_failed',
        defaultMessage: 'Request failed',
    },
    tokenRequired: {
        id: 'solidtime.connect.error.token_required',
        defaultMessage: 'API token is required',
    },
} as const;
