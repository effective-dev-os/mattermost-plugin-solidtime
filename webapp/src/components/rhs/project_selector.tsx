import {usePortalPopover} from 'hooks/usePortalPopover';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useIntl} from 'react-intl';
import {loadFavoriteProjectIds, toggleFavoriteProjectId} from 'utils/favorites';

import type {Project} from 'types/solidtime';

type Props = {
    projects: Project[];
    selectedProjectId: string | null;
    selectedTaskId: string | null;
    onSelect: (projectId: string, taskId: string | null, isBillable: boolean) => void;
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
    userId,
    compact,
    layout = 'inline',
    disabled,
}) => {
    const intl = useIntl();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const close = useCallback(() => {
        setOpen(false);
        setExpandedProjectId(null);
    }, []);
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
    const expandTasksLabel = intl.formatMessage({
        id: 'solidtime.project.expand_tasks',
        defaultMessage: 'Expand tasks',
    });
    const collapseTasksLabel = intl.formatMessage({
        id: 'solidtime.project.collapse_tasks',
        defaultMessage: 'Collapse tasks',
    });

    useEffect(() => {
        if (userId) {
            setFavorites(loadFavoriteProjectIds(userId));
        }
    }, [userId, open]);

    const activeProjects = useMemo(
        () => projects.filter((p) => !p.is_archived),
        [projects],
    );

    const selected = projects.find((p) => p.id === selectedProjectId);

    const filtered = useMemo(() => activeProjects.filter((p) => {
        const q = search.toLowerCase();
        const client = p.client_name || noClientLabel;
        return p.name.toLowerCase().includes(q) || client.toLowerCase().includes(q);
    }), [activeProjects, search, noClientLabel]);

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

    const pickProject = (project: Project, taskId: string | null = null) => {
        onSelect(project.id, taskId, project.is_billable);
        close();
    };

    const handleProjectNameClick = (project: Project) => {
        const tasks = project.tasks;
        if (expandedProjectId === project.id || tasks.length === 0) {
            pickProject(project);
            return;
        }
        setExpandedProjectId(project.id);
    };

    const handleProjectChevronClick = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        if (expandedProjectId === project.id) {
            setExpandedProjectId(null);
            return;
        }
        if (project.tasks.length > 0) {
            setExpandedProjectId(project.id);
        }
    };

    const toggleFavorite = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (!userId) {
            return;
        }
        setFavorites(toggleFavoriteProjectId(userId, projectId));
    };

    const renderProjectRow = (p: Project) => {
        const tasks = p.tasks;
        const hasTasks = tasks.length > 0;
        const expanded = expandedProjectId === p.id;

        return (
            <div
                key={p.id}
                className='solidtime-project-row'
            >
                <button
                    type='button'
                    className='solidtime-project-option'
                    onClick={() => handleProjectNameClick(p)}
                >
                    <span
                        className='solidtime-project-dot'
                        style={{backgroundColor: p.color || '#1C58D9'}}
                    />
                    <span className='solidtime-project-option-label'>{p.name}</span>
                    <span className='solidtime-project-option-actions'>
                        {hasTasks && (
                            <span
                                className='solidtime-project-expand-chevron'
                                onClick={(e) => handleProjectChevronClick(e, p)}
                                role='button'
                                tabIndex={0}
                                aria-expanded={expanded}
                                aria-label={expanded ? collapseTasksLabel : expandTasksLabel}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleProjectChevronClick(e as unknown as React.MouseEvent, p);
                                    }
                                }}
                            >
                                <span
                                    className={`solidtime-nav-chevron ${expanded ? 'solidtime-nav-chevron--up' : 'solidtime-nav-chevron--down'}`}
                                    aria-hidden='true'
                                />
                            </span>
                        )}
                        <span
                            className={`solidtime-fav-btn ${favorites.includes(p.id) ? 'active' : ''}`}
                            onClick={(e) => toggleFavorite(e, p.id)}
                            role='button'
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleFavorite(e as unknown as React.MouseEvent, p.id)}
                        >
                            ☆
                        </span>
                    </span>
                </button>
                {expanded && tasks.map((t) => (
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
    };

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
                    <div className='solidtime-client-header'>
                        {client}
                        <span className='solidtime-client-count'>
                            {intl.formatMessage(
                                {
                                    id: 'solidtime.project.count',
                                    defaultMessage: '{count, plural, one {# Project} few {# Projects} many {# Projects} other {# Projects}}',
                                },
                                {count: clientProjects.length},
                            )}
                        </span>
                    </div>
                    {clientProjects.map(renderProjectRow)}
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
                onClick={() => {
                    if (disabled) {
                        return;
                    }
                    if (open) {
                        close();
                    } else {
                        setOpen(true);
                    }
                }}
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
