import {PluginAPIError} from 'api/errors';
import manifest from 'manifest';

import {Client4 as Client4Class} from '@mattermost/client';

import type {
    ConnectResponse,
    ConnectionStatus,
    CreateTimeEntryRequest,
    OrganizationsResponse,
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

export function connectSolidtime(token: string): Promise<ConnectResponse> {
    return request<ConnectResponse>('/connection/connect', {method: 'post', body: {token}});
}

export function getOrganizations(): Promise<OrganizationsResponse> {
    return request<OrganizationsResponse>('/organizations', {method: 'get'});
}

export function setCurrentOrganization(organizationId: string): Promise<{organization_id: string}> {
    return request('/organizations/current', {method: 'put', body: {organization_id: organizationId}});
}

export function getProjects(): Promise<{projects: Project[]}> {
    return request('/projects', {method: 'get'});
}

export function getTasks(projectId: string): Promise<{tasks: Task[]}> {
    return request(`/tasks?project_id=${encodeURIComponent(projectId)}`, {method: 'get'});
}

export function getActiveTimeEntry(): Promise<{active: TimeEntry | null}> {
    return request('/time-entries/active', {method: 'get'});
}

export async function getTimeEntries(params: {start: string; end: string}): Promise<{entries: TimeEntry[]}> {
    const q = new URLSearchParams({
        start: params.start,
        end: params.end,
    });
    const data = await request<{entries: TimeEntry[] | null}>(`/time-entries?${q.toString()}`, {method: 'get'});
    return {entries: data.entries ?? []};
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

export function deleteTimeEntry(id: string): Promise<void> {
    return request(`/time-entries/${id}`, {method: 'delete'});
}
