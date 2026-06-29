import {usePortalPopover} from 'hooks/usePortalPopover';
import React, {useCallback, useState} from 'react';
import {createPortal} from 'react-dom';

import type {Project, Task} from 'types/solidtime';

type Props = {
    projects: Project[];
    selectedProjectId: string | null;
    selectedTaskId: string | null;
    onSelect: (projectId: string, taskId: string | null, isBillable: boolean) => void;
    loadTasks: (projectId: string) => Promise<Task[]>;
    compact?: boolean;
};

const ProjectSelector: React.FC<Props> = ({
    projects,
    selectedProjectId,
    selectedTaskId,
    onSelect,
    loadTasks,
    compact,
}) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({});
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const close = useCallback(() => setOpen(false), []);
    const {triggerRef, popoverRef, style} = usePortalPopover(open, close, {width: 300});

    const selected = projects.find((p) => p.id === selectedProjectId);

    const filtered = projects.filter((p) => {
        const q = search.toLowerCase();
        const client = p.client_name || 'No client';
        return p.name.toLowerCase().includes(q) || client.toLowerCase().includes(q);
    });

    const byClient = filtered.reduce<Record<string, Project[]>>((acc, p) => {
        const key = p.client_name || 'No client';
        acc[key] = acc[key] || [];
        acc[key].push(p);
        return acc;
    }, {});

    const ensureTasks = async (projectId: string) => {
        if (tasksByProject[projectId]) {
            return tasksByProject[projectId];
        }
        const loaded = await loadTasks(projectId);
        setTasksByProject((prev) => ({...prev, [projectId]: loaded}));
        return loaded;
    };

    const pickProject = (project: Project, taskId: string | null = null) => {
        onSelect(project.id, taskId, project.is_billable);
        setOpen(false);
        setExpandedProjectId(null);
    };

    const toggleProject = async (project: Project) => {
        if (expandedProjectId === project.id) {
            pickProject(project);
            return;
        }
        await ensureTasks(project.id);
        setExpandedProjectId(project.id);
    };

    const label = selected ?
        `${selected.name}${selected.client_name ? ` — ${selected.client_name}` : ''}` :
        '+ Project';

    const dropdown = open && style && createPortal(
        <div
            ref={popoverRef}
            className='solidtime-project-dropdown'
            style={style}
        >
            <input
                className='solidtime-project-search'
                placeholder='Search Project or Client'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {Object.entries(byClient).map(([client, clientProjects]) => (
                <div
                    key={client}
                    className='solidtime-client-group'
                >
                    <button
                        type='button'
                        className='solidtime-client-header'
                        onClick={() => setExpandedClient(expandedClient === client ? null : client)}
                    >
                        {expandedClient === client ? '▼' : '▶'} {client}
                        <span className='solidtime-client-count'>{clientProjects.length} Project</span>
                    </button>
                    {(expandedClient === null || expandedClient === client) && clientProjects.map((p) => (
                        <div
                            key={p.id}
                            className='solidtime-project-row'
                        >
                            <button
                                type='button'
                                className='solidtime-project-option'
                                onClick={() => toggleProject(p)}
                            >
                                <span
                                    className='solidtime-project-dot'
                                    style={{backgroundColor: p.color || '#1C58D9'}}
                                />
                                <span className='solidtime-project-option-label'>{p.name}</span>
                            </button>
                            {expandedProjectId === p.id && (tasksByProject[p.id] || []).map((t) => (
                                <button
                                    key={t.id}
                                    type='button'
                                    className={`solidtime-task-option ${selectedTaskId === t.id ? 'selected' : ''}`}
                                    onClick={() => pickProject(p, t.id)}
                                >
                                    <span className='solidtime-project-option-label'>{t.name}</span>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </div>,
        document.body,
    );

    return (
        <div
            className={`solidtime-project-selector ${compact ? 'compact' : ''}`}
            ref={triggerRef}
        >
            {!compact && <span className='solidtime-required'>*</span>}
            <button
                type='button'
                className='solidtime-project-trigger'
                onClick={() => setOpen(!open)}
                title={selected ? label : undefined}
            >
                {selected && (
                    <span
                        className='solidtime-project-dot'
                        style={{backgroundColor: selected.color || '#1C58D9'}}
                    />
                )}
                <span className='solidtime-project-label'>{label}</span>
            </button>
            {dropdown}
        </div>
    );
};

export default ProjectSelector;
