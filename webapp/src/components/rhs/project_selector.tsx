import {usePortalPopover} from 'hooks/usePortalPopover';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useIntl} from 'react-intl';
import {loadFavoriteProjectIds, toggleFavoriteProjectId} from 'utils/favorites';

import type {Project} from 'types/solidtime';

function scrollListOptionIntoView(
    container: HTMLElement,
    element: HTMLElement,
    direction: 'up' | 'down',
) {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    if (direction === 'down' && elementRect.bottom > containerRect.bottom) {
        container.scrollTop += elementRect.bottom - containerRect.bottom;
    } else if (direction === 'up' && elementRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - elementRect.top;
    }
}

function focusListOption(
    container: HTMLElement,
    element: HTMLElement,
    direction: 'up' | 'down',
) {
    element.focus({preventScroll: true});
    scrollListOptionIntoView(container, element, direction);
}

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
    const [focusedOptionKey, setFocusedOptionKey] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const close = useCallback(() => {
        setOpen(false);
        setExpandedProjectId(null);
        setFocusedOptionKey(null);
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

    useEffect(() => {
        if (userId) {
            setFavorites(loadFavoriteProjectIds(userId));
        }
    }, [userId, open]);

    const activeProjects = useMemo(
        () => projects.filter((p) => !p.is_archived),
        [projects],
    );

    const noTasksLabel = intl.formatMessage({
        id: 'solidtime.project.no_tasks',
        defaultMessage: 'No tasks yet',
    });

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

    const pickTask = (project: Project, taskId: string) => {
        onSelect(project.id, taskId, project.is_billable);
        close();
    };

    const toggleProjectExpanded = (projectId: string) => {
        setExpandedProjectId((current) => (current === projectId ? null : projectId));
    };

    const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
            return;
        }
        const root = popoverRef.current;
        if (!root?.contains(document.activeElement)) {
            return;
        }

        const buttons = Array.from(
            root.querySelectorAll<HTMLButtonElement>('button.solidtime-project-option, button.solidtime-task-option'),
        );
        if (buttons.length === 0) {
            return;
        }

        if (document.activeElement === searchRef.current) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const first = buttons[0];
                setFocusedOptionKey(first.dataset.optionKey ?? null);
                focusListOption(root, first, 'down');
            } else {
                e.preventDefault();
            }
            return;
        }

        const focusSearch = () => {
            setFocusedOptionKey(null);
            root.scrollTop = 0;
            searchRef.current?.focus({preventScroll: true});
        };

        const active = document.activeElement;
        let idx = buttons.findIndex((b) => b === active);
        if (idx === -1 && active instanceof HTMLElement) {
            const row = active.closest('.solidtime-project-row');
            const projectBtn = row?.querySelector<HTMLButtonElement>('button.solidtime-project-option');
            if (projectBtn) {
                idx = buttons.indexOf(projectBtn);
            }
        }
        if (idx === -1) {
            return;
        }

        e.preventDefault();
        if (e.key === 'ArrowUp' && idx === 0) {
            focusSearch();
            return;
        }
        if (e.key === 'ArrowDown' && idx === buttons.length - 1) {
            focusSearch();
            return;
        }

        const nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        const next = buttons[nextIdx];
        const direction = e.key === 'ArrowDown' ? 'down' : 'up';
        setFocusedOptionKey(next.dataset.optionKey ?? null);
        focusListOption(root, next, direction);
    }, [popoverRef]);

    const handleProjectNameClick = (project: Project) => {
        toggleProjectExpanded(project.id);
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
        const expanded = expandedProjectId === p.id;
        const projectOptionKey = `p:${p.id}`;

        return (
            <div
                key={p.id}
                className='solidtime-project-row'
            >
                <button
                    type='button'
                    className={`solidtime-project-option ${focusedOptionKey === projectOptionKey ? 'solidtime-option--focused' : ''}`}
                    data-option-key={projectOptionKey}
                    onClick={() => handleProjectNameClick(p)}
                    onFocus={() => setFocusedOptionKey(projectOptionKey)}
                    aria-expanded={expanded}
                >
                    <span
                        className='solidtime-project-dot'
                        style={{backgroundColor: p.color || '#1C58D9'}}
                    />
                    <span className='solidtime-project-option-label' title={p.name}>
                        {p.name}
                    </span>
                    <span className='solidtime-project-option-actions'>
                        <span
                            className='solidtime-project-expand-chevron'
                            aria-hidden='true'
                        >
                            <span
                                className={`solidtime-nav-chevron ${expanded ? 'solidtime-nav-chevron--up' : 'solidtime-nav-chevron--down'}`}
                            />
                        </span>
                        <span
                            className={`solidtime-fav-btn ${favorites.includes(p.id) ? 'active' : ''}`}
                            onClick={(e) => toggleFavorite(e, p.id)}
                            role='button'
                            tabIndex={0}
                            onFocus={() => setFocusedOptionKey(projectOptionKey)}
                            onKeyDown={(e) => e.key === 'Enter' && toggleFavorite(e as unknown as React.MouseEvent, p.id)}
                        >
                            ☆
                        </span>
                    </span>
                </button>
                {expanded && (tasks.length === 0 ? (
                    <div className='solidtime-task-empty'>
                        {noTasksLabel}
                    </div>
                ) : tasks.map((t) => {
                    const taskOptionKey = `t:${p.id}:${t.id}`;
                    return (
                        <button
                            key={t.id}
                            type='button'
                            className={`solidtime-task-option ${selectedTaskId === t.id ? 'selected' : ''} ${focusedOptionKey === taskOptionKey ? 'solidtime-option--focused' : ''}`}
                            data-option-key={taskOptionKey}
                            onClick={() => pickTask(p, t.id)}
                            onFocus={() => setFocusedOptionKey(taskOptionKey)}
                        >
                            <span className='solidtime-project-option-label' title={t.name}>
                                {t.name}
                            </span>
                        </button>
                    );
                }))}
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
            onKeyDownCapture={handleDropdownKeyDown}
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
                onFocus={() => setFocusedOptionKey(null)}
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
                title={label}
                aria-label={isField ? intl.formatMessage({id: 'solidtime.project.select', defaultMessage: 'Select project'}) : undefined}
            >
                {selected && (
                    <span
                        className='solidtime-project-dot'
                        style={{backgroundColor: selected.color || '#1C58D9'}}
                    />
                )}
                <span className='solidtime-project-label' title={label}>
                    {label}
                </span>
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
