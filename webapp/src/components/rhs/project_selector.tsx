import {usePortalPopover} from 'hooks/usePortalPopover';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useIntl} from 'react-intl';
import {loadFavoriteProjectIds, toggleFavoriteProjectId} from 'utils/favorites';

import type {Project, Task} from 'types/solidtime';

type Props = {
    projects: Project[];
    selectedProjectId: string | null;
    selectedTaskId: string | null;
    onSelect: (projectId: string, taskId: string | null, isBillable: boolean) => void;
    loadTasks: (projectId: string) => Promise<Task[]>;
    userId?: string;
    compact?: boolean;
    layout?: 'inline' | 'field';
    disabled?: boolean;
};

const ProjectSelector: React.FC<Props> = ({
    projects,
    selectedProjectId,
    selectedTaskId,
    onSelect,
    loadTasks,
    userId,
    compact,
    layout = 'inline',
    disabled,
}) => {
    const intl = useIntl();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({});
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const close = useCallback(() => setOpen(false), []);
    const searchRef = useRef<HTMLInputElement>(null);
    const didFocusSearchRef = useRef(false);
    const {triggerRef, popoverRef, style} = usePortalPopover(open, close, {width: 300});

    useEffect(() => {
        if (!open) {
            didFocusSearchRef.current = false;
            return;
        }
        if (style && !didFocusSearchRef.current) {
            searchRef.current?.focus();
            didFocusSearchRef.current = true;
        }
    }, [open, style]);

    const noClientLabel = intl.formatMessage({
        id: 'solidtime.project.no_client',
        defaultMessage: 'No client',
    });

    useEffect(() => {
        if (userId) {
            setFavorites(loadFavoriteProjectIds(userId));
        }
    }, [userId, open]);

    const selected = projects.find((p) => p.id === selectedProjectId);

    const filtered = projects.filter((p) => {
        const q = search.toLowerCase();
        const client = p.client_name || noClientLabel;
        return p.name.toLowerCase().includes(q) || client.toLowerCase().includes(q);
    });

    const favoriteProjects = useMemo(
        () => filtered.filter((p) => favorites.includes(p.id)),
        [filtered, favorites],
    );

    const byClient = filtered.filter((p) => !favorites.includes(p.id)).reduce<Record<string, Project[]>>((acc, p) => {
        const key = p.client_name || noClientLabel;
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

    const toggleFavorite = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!userId) {
            return;
        }
        setFavorites(toggleFavoriteProjectId(userId, projectId));
    };

    const renderProjectRow = (p: Project) => (
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
                <span
                    className={`solidtime-fav-btn ${favorites.includes(p.id) ? 'active' : ''}`}
                    onClick={(e) => toggleFavorite(e, p.id)}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && toggleFavorite(e as unknown as React.MouseEvent, p.id)}
                >
                    ☆
                </span>
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
    );

    let emptyLabel = intl.formatMessage({id: 'solidtime.project.add', defaultMessage: '+ Project'});
    if (layout === 'field') {
        emptyLabel = intl.formatMessage({id: 'solidtime.project.select', defaultMessage: 'Select project'});
    }
    const label = selected ?
        `${selected.name}${selected.client_name ? ` — ${selected.client_name}` : ''}` :
        emptyLabel;

    const isField = layout === 'field';

    const dropdown = open && style && createPortal(
        <div
            ref={popoverRef}
            className='solidtime-project-dropdown'
            style={style}
        >
            <input
                ref={searchRef}
                className='solidtime-project-search solidtime-field-control'
                placeholder={intl.formatMessage({
                    id: 'solidtime.project.search_placeholder',
                    defaultMessage: 'Search Project or Client',
                })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            {favoriteProjects.length > 0 && (
                <div className='solidtime-favorites-group'>
                    <div className='solidtime-favorites-header'>
                        {intl.formatMessage({id: 'solidtime.project.favorites', defaultMessage: 'Favorites'})}
                    </div>
                    {favoriteProjects.map(renderProjectRow)}
                </div>
            )}
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
                        <span className='solidtime-client-count'>
                            {intl.formatMessage(
                                {
                                    id: 'solidtime.project.count',
                                    defaultMessage: '{count, plural, one {# Project} few {# Projects} many {# Projects} other {# Projects}}',
                                },
                                {count: clientProjects.length},
                            )}
                        </span>
                    </button>
                    {(expandedClient === null || expandedClient === client) && clientProjects.map(renderProjectRow)}
                </div>
            ))}
        </div>,
        document.body,
    );

    return (
        <div
            className={`solidtime-project-selector ${compact ? 'compact' : ''} ${isField ? 'solidtime-project-selector--field' : ''}`}
            ref={triggerRef}
        >
            {!compact && !isField && <span className='solidtime-required'>*</span>}
            <button
                type='button'
                className={`solidtime-project-trigger ${isField ? 'solidtime-project-trigger--field' : ''} ${!selected && isField ? 'is-placeholder' : ''}`}
                onClick={() => !disabled && setOpen(!open)}
                disabled={disabled}
                title={selected ? label : undefined}
                aria-label={isField ? intl.formatMessage({id: 'solidtime.project.select', defaultMessage: 'Select project'}) : undefined}
            >
                {selected && (
                    <span
                        className='solidtime-project-dot'
                        style={{backgroundColor: selected.color || '#1C58D9'}}
                    />
                )}
                <span className='solidtime-project-label'>{label}</span>
                {isField && (
                    <span
                        className='solidtime-project-chevron'
                        aria-hidden='true'
                    >
                        ▾
                    </span>
                )}
            </button>
            {dropdown}
        </div>
    );
};

export default ProjectSelector;
