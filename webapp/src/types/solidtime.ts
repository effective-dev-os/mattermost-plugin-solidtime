export type ConnectionStatus = {
    connected: boolean;
    server_url: string;
};

export type ConnectResponse = {
    connected: boolean;
    user_name: string;
};

export type Organization = {
    org_id: string;
    member_id: string;
    org_name: string;
};

export type OrganizationsResponse = {
    organizations: Organization[];
    current_id: string;
};

export type Project = {
    id: string;
    name: string;
    color: string;
    client_id: string | null;
    client_name: string | null;
    is_billable: boolean;
};

export type Task = {
    id: string;
    name: string;
    is_done: boolean;
    project_id: string;
};

export type TimeEntry = {
    id: string;
    start: string;
    end: string | null;
    duration: number | null;
    description: string | null;
    task_id: string | null;
    project_id: string | null;
    organization_id: string;
    user_id: string;
    billable: boolean;
};

export type CreateTimeEntryRequest = {
    description?: string | null;
    project_id?: string | null;
    task_id?: string | null;
    start: string;
    end?: string | null;
    billable: boolean;
};

export type UpdateTimeEntryRequest = {
    description?: string | null;
    project_id?: string | null;
    task_id?: string | null;
    start?: string;
    end?: string | null;
    billable?: boolean;
};
