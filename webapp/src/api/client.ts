import {PluginAPIError} from 'api/errors';
import manifest from 'manifest';

import {Client4 as Client4Class} from '@mattermost/client';

import type {
    ConnectionStatus,
    CreateTimeEntryRequest,
    Project,
    Task,
    TimeEntry,
    UpdateTimeEntryRequest,
} from 'types/solidtime';

const Client4 = new Client4Class();

const baseApiPath = `/plugins/${manifest.id}`;

type RequestOptions = {
    method: 'get' | 'post' | 'put' | 'delete';
    body?: Record<string, unknown>;
};

async function request<T>(url: string, opts: RequestOptions): Promise<T> {
    const options: Parameters<typeof Client4.getOptions>[0] = {
        method: opts.method.toUpperCase(),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (opts.body && opts.method !== 'get') {
        options.body = JSON.stringify(opts.body);
    }

    const response = await fetch(`${baseApiPath}/api/v1${url}`, Client4.getOptions(options));

    if (response.ok) {
        if (response.status === 204) {
            return {} as T;
        }
        return response.json();
    }

    const text = await response.text();
    let message = text;
    let code = '';
    try {
        const parsed = JSON.parse(text);
        message = parsed.message || text;
        if (typeof parsed.error === 'string') {
            code = parsed.error;
        }
    } catch {
        // keep raw text
    }

    throw new PluginAPIError(response.status, code, message || `Request failed (${response.status})`);
}

export function getConnectionStatus(): Promise<ConnectionStatus> {
    return request<ConnectionStatus>('/connection/status', {method: 'get'});
}

export function getProjects(): Promise<{projects: Project[]}> {
    return request('/projects', {method: 'get'});
}

export function getTasks(projectId: string): Promise<{tasks: Task[]}> {
    return request(`/tasks?project_id=${encodeURIComponent(projectId)}`, {method: 'get'});
}

export function getTimeEntries(params: {start: string; end: string; limit?: number; offset?: number}): Promise<{entries: TimeEntry[]}> {
    const q = new URLSearchParams({
        start: params.start,
        end: params.end,
    });
    if (params.limit) {
        q.set('limit', String(params.limit));
    }
    if (params.offset) {
        q.set('offset', String(params.offset));
    }
    return request(`/time-entries?${q.toString()}`, {method: 'get'});
}

export function getWeekTotal(start: string, end: string): Promise<{seconds: number}> {
    const q = new URLSearchParams({start, end});
    return request(`/time-entries/aggregate?${q.toString()}`, {method: 'get'});
}

export function createTimeEntry(body: CreateTimeEntryRequest): Promise<TimeEntry> {
    return request('/time-entries', {method: 'post', body});
}

export function updateTimeEntry(id: string, body: UpdateTimeEntryRequest): Promise<TimeEntry> {
    return request(`/time-entries/${id}`, {method: 'put', body});
}
