import {createTimeEntry, updateTimeEntry} from 'api/client';
import {handlePluginApiError} from 'api/errors';
import Fuse from 'fuse.js';
import {usePortalPopover} from 'hooks/usePortalPopover';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {setActiveTimer, setEntryMode, type EntryMode} from 'reducer';
import {loadEntryMode, saveEntryMode} from 'utils/entry_mode';
import {focusRhsField, isSolidtimeRhsOpen} from 'utils/rhs';
import {
    defaultFormTimes,
    formatElapsed,
    formatSolidtimeUTC,
    nextFormTimes,
    parseTime,
    toUTCISO,
} from 'utils/time';

import type {GlobalState} from '@mattermost/types/store';

import {getPluginState} from 'selectors';

import type {CreateTimeEntryRequest, Project, Task, TimeEntry} from 'types/solidtime';

import ProjectSelector from './project_selector';
import TimeRangeInput from './time_range_input';

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
    entriesForAutocomplete: TimeEntry[];
    onCreated: () => void;
    onError: (message: string) => void;
    onConnectionLost: () => void;
};

const TimeEntryForm: React.FC<Props> = ({projects, entriesForAutocomplete, onCreated, onError, onConnectionLost}) => {
    const intl = useIntl();
    const dispatch = useDispatch();
    const {activeTimer, entryMode} = useSelector((state: GlobalState) => getPluginState(state));
    const userId = useSelector((state: GlobalState) => state.entities.users.currentUserId);
    const rhsOpen = useSelector((state: GlobalState) => isSolidtimeRhsOpen(state));

    const defaults = defaultFormTimes();
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [billable, setBillable] = useState(true);
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(defaults.start);
    const [endTime, setEndTime] = useState(defaults.end);
    const startTimeRef = useRef(defaults.start);
    const endTimeRef = useRef(defaults.end);
    const [submitting, setSubmitting] = useState(false);
    const [elapsedTick, setElapsedTick] = useState(0);
    const modeRestored = useRef(false);
    const descriptionRef = useRef<HTMLInputElement>(null);
    const prevRhsOpen = useRef(false);

    const [autocompleteOpen, setAutocompleteOpen] = useState(false);
    const [focusedEntityOptionKey, setFocusedEntityOptionKey] = useState<string | null>(null);
    const closeAutocomplete = useCallback(() => {
        setAutocompleteOpen(false);
        setFocusedEntityOptionKey(null);
    }, []);
    const {
        triggerRef: autocompleteTriggerRef,
        popoverRef: autocompletePopoverRef,
        style: autocompleteStyle,
    } = usePortalPopover(autocompleteOpen, closeAutocomplete, {matchTriggerWidth: true});

    const isTimerMode = entryMode === 'timer';
    const timerRunning = Boolean(activeTimer);

    useEffect(() => {
        if (!userId || modeRestored.current) {
            return;
        }
        modeRestored.current = true;
        const saved = loadEntryMode(userId);
        dispatch(setEntryMode(activeTimer ? 'timer' : saved));
    }, [userId, activeTimer, dispatch]);

    useEffect(() => {
        if (!rhsOpen) {
            prevRhsOpen.current = false;
            return undefined;
        }
        if (!prevRhsOpen.current) {
            prevRhsOpen.current = true;
            return focusRhsField(descriptionRef.current);
        }
        return undefined;
    }, [rhsOpen]);

    const selectEntryMode = (mode: EntryMode) => {
        dispatch(setEntryMode(mode));
        if (userId) {
            saveEntryMode(userId, mode);
        }
    };

    useEffect(() => {
        if (!timerRunning || !activeTimer) {
            return undefined;
        }
        const id = window.setInterval(() => setElapsedTick((t) => t + 1), 1000);
        return () => window.clearInterval(id);
    }, [timerRunning, activeTimer]);

    const handleTimeChange = (d: Date, start: string, end: string) => {
        if (isTimerMode) {
            return;
        }
        startTimeRef.current = start;
        endTimeRef.current = end;
        setDate(d);
        setStartTime(start);
        setEndTime(end);
    };

    useEffect(() => {
        startTimeRef.current = startTime;
        endTimeRef.current = endTime;
    }, [startTime, endTime]);

    const descriptionRequiredError = intl.formatMessage({
        id: 'solidtime.form.validation.description_required',
        defaultMessage: 'Please enter a description',
    });
    const projectRequiredError = intl.formatMessage({
        id: 'solidtime.form.validation.project_required',
        defaultMessage: 'Please select a project',
    });
    const invalidTimeError = intl.formatMessage({
        id: 'solidtime.form.validation.invalid_time',
        defaultMessage: 'Invalid time format',
    });
    const endAfterStartError = intl.formatMessage({
        id: 'solidtime.form.validation.end_after_start',
        defaultMessage: 'End time must be after start time',
    });
    const taskRequiredError = intl.formatMessage({
        id: 'solidtime.form.validation.task_required',
        defaultMessage: 'Please select a task',
    });

    const noClientLabel = intl.formatMessage({
        id: 'solidtime.project.no_client',
        defaultMessage: 'No client',
    });

    type AutocompleteItem = {
        optionKey: string;
        entryId: string;
        entityName: string;
        projectId: string;
        taskId: string;
        billable: boolean;
        projectName: string;
        projectColor: string;
        taskName: string;
        clientName: string;
    };

    const taskResolutionById = useMemo(() => {
        const map = new Map<string, {project: Project; task: Task}>();
        for (const p of projects) {
            for (const t of p.tasks) {
                map.set(t.id, {project: p, task: t});
            }
        }
        return map;
    }, [projects]);

    // "Entity list" dataset for the autocomplete (derived from currently loaded week entries).
    // ponytail: we use the loaded order as "date of addition" because TimeEntryResource doesn't expose created_at in our types/openapi.
    const autocompleteItems = useMemo((): AutocompleteItem[] => {
        const items: AutocompleteItem[] = [];
        for (const entry of entriesForAutocomplete) {
            const entityName = entry.description?.trim() ?? '';
            if (!entityName) {
                continue;
            }
            if (!entry.project_id || !entry.task_id) {
                continue;
            }
            const resolved = taskResolutionById.get(entry.task_id);
            if (!resolved || resolved.project.id !== entry.project_id) {
                continue;
            }
            const clientName = resolved.project.client_name || noClientLabel;
            items.push({
                optionKey: `e:${entry.id}`,
                entryId: entry.id,
                entityName,
                projectId: entry.project_id,
                taskId: entry.task_id,
                billable: entry.billable,
                projectName: resolved.project.name,
                projectColor: resolved.project.color,
                taskName: resolved.task.name,
                clientName,
            });
        }
        return items;
    }, [entriesForAutocomplete, taskResolutionById, noClientLabel]);

    const lastAutocompleteItems = useMemo(
        () => autocompleteItems.slice(-8).reverse(),
        [autocompleteItems],
    );

    const autocompleteFuse = useMemo(() => {
        if (autocompleteItems.length === 0) {
            return null;
        }
        return new Fuse<AutocompleteItem>(autocompleteItems, {
            keys: ['entityName', 'projectName', 'clientName'],
            threshold: 0.35,
            ignoreLocation: true,
            minMatchCharLength: 1,
        });
    }, [autocompleteItems]);

    const autocompleteQuery = description.trim();

    const autocompleteSuggestions = useMemo((): AutocompleteItem[] => {
        if (!autocompleteOpen) {
            return [];
        }
        if (autocompleteItems.length === 0) {
            return [];
        }
        if (!autocompleteQuery) {
            return lastAutocompleteItems;
        }
        if (!autocompleteFuse) {
            return [];
        }
        return autocompleteFuse.search(autocompleteQuery).slice(0, 8).map((r) => r.item);
    }, [autocompleteFuse, autocompleteItems.length, autocompleteOpen, autocompleteQuery, lastAutocompleteItems]);

    const openAutocomplete = useCallback(() => {
        setAutocompleteOpen(true);
        setFocusedEntityOptionKey(null);
    }, []);

    const selectAutocompleteItem = useCallback((item: AutocompleteItem) => {
        setDescription(item.entityName);
        setProjectId(item.projectId);
        setTaskId(item.taskId);
        setBillable(item.billable);
        closeAutocomplete();
    }, [closeAutocomplete]);

    const handleDescriptionBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        if (!autocompleteOpen) {
            return;
        }
        const nextTarget = e.relatedTarget as Node | null;
        if (nextTarget && autocompletePopoverRef.current?.contains(nextTarget)) {
            return;
        }
        closeAutocomplete();
    }, [autocompleteOpen, autocompletePopoverRef, closeAutocomplete]);

    const handleAutocompleteKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!autocompleteOpen) {
            return;
        }
        if (!autocompletePopoverRef.current) {
            return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Escape') {
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closeAutocomplete();
            return;
        }

        const root = autocompletePopoverRef.current;
        const buttons = Array.from(
            root.querySelectorAll<HTMLButtonElement>('button.solidtime-entity-autocomplete-option'),
        );
        if (buttons.length === 0) {
            return;
        }

        if (document.activeElement === descriptionRef.current) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const first = buttons[0];
                setFocusedEntityOptionKey(first.dataset.optionKey ?? null);
                focusListOption(root, first, 'down');
            } else {
                e.preventDefault();
            }
            return;
        }

        const focusDescription = () => {
            setFocusedEntityOptionKey(null);
            descriptionRef.current?.focus({preventScroll: true});
        };

        const active = document.activeElement;
        const idx = buttons.findIndex((b) => b === active);
        if (idx === -1) {
            return;
        }

        e.preventDefault();
        if (e.key === 'ArrowUp' && idx === 0) {
            focusDescription();
            return;
        }
        if (e.key === 'ArrowDown' && idx === buttons.length - 1) {
            focusDescription();
            return;
        }

        const nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
        const next = buttons[nextIdx];
        const direction = e.key === 'ArrowDown' ? 'down' : 'up';
        setFocusedEntityOptionKey(next.dataset.optionKey ?? null);
        focusListOption(root, next, direction);
    }, [autocompleteOpen, autocompletePopoverRef, closeAutocomplete]);

    const handleManualSubmit = async () => {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            onError(descriptionRequiredError);
            return;
        }
        if (!projectId) {
            onError(projectRequiredError);
            return;
        }
        if (!taskId) {
            onError(taskRequiredError);
            return;
        }
        const startParts = parseTime(startTimeRef.current);
        const endParts = parseTime(endTimeRef.current);
        if (!startParts || !endParts) {
            onError(invalidTimeError);
            setStartTime(startTimeRef.current);
            setEndTime(endTimeRef.current);
            return;
        }
        const startISO = toUTCISO(date, startParts.hours, startParts.minutes);
        const endISO = toUTCISO(date, endParts.hours, endParts.minutes);
        if (new Date(endISO) <= new Date(startISO)) {
            onError(endAfterStartError);
            return;
        }

        setSubmitting(true);
        try {
            const payload: CreateTimeEntryRequest = {
                description: trimmedDescription,
                project_id: projectId,
                start: startISO,
                end: endISO,
                billable,
                task_id: taskId,
            };
            await createTimeEntry(payload);
            setDescription('');
            const next = nextFormTimes(date, startParts, endParts);
            setDate(next.date);
            setStartTime(next.start);
            setEndTime(next.end);
            onCreated();
        } catch (e) {
            handlePluginApiError(e, onConnectionLost, onError, intl);
        } finally {
            setSubmitting(false);
        }
    };

    const handleTimerAction = async () => {
        setSubmitting(true);
        try {
            if (timerRunning && activeTimer) {
                const updated = await updateTimeEntry(activeTimer.id, {end: formatSolidtimeUTC(new Date())});
                dispatch(setActiveTimer(null));
                if (updated.end) {
                    onCreated();
                }
            } else {
                const trimmedDescription = description.trim();
                if (!trimmedDescription) {
                    onError(descriptionRequiredError);
                    return;
                }
                if (!projectId) {
                    onError(projectRequiredError);
                    return;
                }
                if (!taskId) {
                    onError(taskRequiredError);
                    return;
                }
                const payload: CreateTimeEntryRequest = {
                    description: trimmedDescription,
                    project_id: projectId,
                    start: formatSolidtimeUTC(new Date()),
                    end: null,
                    billable,
                    task_id: taskId,
                };
                const entry = await createTimeEntry(payload);
                dispatch(setActiveTimer(entry));
            }
        } catch (e) {
            handlePluginApiError(e, onConnectionLost, onError, intl);
        } finally {
            setSubmitting(false);
        }
    };

    const timerDisplay = activeTimer ?
        formatElapsed(activeTimer.start) :
        '00:00';

    let submitLabel = intl.formatMessage({id: 'solidtime.form.add_entry', defaultMessage: 'Add entry'});
    if (isTimerMode) {
        submitLabel = timerRunning ?
            intl.formatMessage({id: 'solidtime.form.stop_timer', defaultMessage: 'Stop timer'}) :
            intl.formatMessage({id: 'solidtime.form.start_timer', defaultMessage: 'Start timer'});
    }

    const hasRequiredFields = Boolean(projectId && taskId && description.trim());
    const submitDisabled = submitting || (isTimerMode ? (!timerRunning && !hasRequiredFields) : !hasRequiredFields);
    const billableTitle = billable ?
        intl.formatMessage({id: 'solidtime.form.billable', defaultMessage: 'Billable'}) :
        intl.formatMessage({id: 'solidtime.form.non_billable', defaultMessage: 'Non-billable'});

    return (
        <div className='solidtime-form'>
            <div className='solidtime-form-stack'>
                <label className='solidtime-field'>
                    <span className='solidtime-field-label'>
                        <FormattedMessage
                            id='solidtime.form.description'
                            defaultMessage='Description'
                        />
                        <span
                            className='solidtime-field-required'
                            aria-hidden='true'
                        >
                            *
                        </span>
                    </span>
                    <div
                        ref={autocompleteTriggerRef}
                        className='solidtime-description-input-wrap'
                    >
                        <input
                            ref={descriptionRef}
                            className='solidtime-field-control'
                            placeholder={intl.formatMessage({
                                id: 'solidtime.form.description_placeholder',
                                defaultMessage: 'What have you worked on?',
                            })}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onPointerDown={() => {
                                if (!submitting) {
                                    openAutocomplete();
                                }
                            }}
                            onBlur={handleDescriptionBlur}
                            onKeyDown={handleAutocompleteKeyDown}
                            disabled={submitting}
                        />
                    </div>
                </label>

                {autocompleteOpen && autocompleteStyle && autocompleteSuggestions.length > 0 && createPortal(
                    <div
                        ref={autocompletePopoverRef}
                        className='solidtime-project-dropdown'
                        style={autocompleteStyle}
                        onKeyDownCapture={handleAutocompleteKeyDown}
                    >
                        {autocompleteSuggestions.map((item) => (
                            <button
                                key={item.entryId}
                                type='button'
                                className={`solidtime-entity-autocomplete-option ${focusedEntityOptionKey === item.optionKey ? 'solidtime-option--focused' : ''}`}
                                data-option-key={item.optionKey}
                                onFocus={() => setFocusedEntityOptionKey(item.optionKey)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectAutocompleteItem(item);
                                }}
                                onClick={() => selectAutocompleteItem(item)}
                            >
                                <span
                                    className='solidtime-entity-autocomplete-entity'
                                    title={item.entityName}
                                >
                                    {item.entityName}
                                </span>
                                <span className='solidtime-entity-autocomplete-meta'>
                                    <span
                                        className='solidtime-project-dot'
                                        style={{backgroundColor: item.projectColor}}
                                    />
                                    <span
                                        className='solidtime-entity-autocomplete-meta-text'
                                        title={`${item.projectName}: ${item.taskName} - ${item.clientName}`}
                                    >
                                        <span style={{color: item.projectColor}}>
                                            {item.projectName}
                                        </span>
                                        :{' '}
                                        <span style={{color: item.projectColor}}>
                                            {item.taskName}
                                        </span>
                                        <span className='solidtime-entity-autocomplete-client'>
                                            {' '}- {item.clientName}
                                        </span>
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>,
                    document.body,
                )}

                <div className='solidtime-form-row-fields'>
                    <label className='solidtime-field solidtime-field--project'>
                        <span className='solidtime-field-label'>
                            <FormattedMessage
                                id='solidtime.form.project'
                                defaultMessage='Project'
                            />
                            <span
                                className='solidtime-field-required'
                                aria-hidden='true'
                            >
                                *
                            </span>
                        </span>
                        <ProjectSelector
                            layout='field'
                            projects={projects}
                            selectedProjectId={projectId}
                            selectedTaskId={taskId}
                            userId={userId}
                            disabled={submitting}
                            onSelect={(pid, tid, isBillable) => {
                                setProjectId(pid);
                                setTaskId(tid);
                                setBillable(isBillable);
                            }}
                        />
                    </label>

                    <div className='solidtime-field solidtime-field--time'>
                        <span className='solidtime-field-label'>
                            {isTimerMode ? (
                                <FormattedMessage
                                    id='solidtime.form.elapsed'
                                    defaultMessage='Elapsed'
                                />
                            ) : (
                                <FormattedMessage
                                    id='solidtime.form.time'
                                    defaultMessage='Time'
                                />
                            )}
                        </span>
                        <div className='solidtime-time-panel'>
                            <button
                                type='button'
                                className={`solidtime-billable solidtime-billable--panel ${billable ? 'active' : ''}`}
                                onClick={() => setBillable(!billable)}
                                aria-label={intl.formatMessage({
                                    id: 'solidtime.form.toggle_billable',
                                    defaultMessage: 'Toggle billable',
                                })}
                                aria-pressed={billable}
                                disabled={submitting}
                                title={billableTitle}
                            >
                                $
                            </button>
                            {isTimerMode ? (
                                <div
                                    className='solidtime-timer-display solidtime-timer-display--panel'
                                    aria-live='polite'
                                    key={elapsedTick}
                                >
                                    {timerDisplay}
                                </div>
                            ) : (
                                <TimeRangeInput
                                    date={date}
                                    startTime={startTime}
                                    endTime={endTime}
                                    onChange={handleTimeChange}
                                    disabled={submitting}
                                    variant='panel'
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className='solidtime-form-footer'>
                <div
                    className='solidtime-mode-toggle'
                    role='group'
                    aria-label={intl.formatMessage({
                        id: 'solidtime.form.entry_mode',
                        defaultMessage: 'Entry mode',
                    })}
                >
                    <button
                        type='button'
                        className={entryMode === 'manual' ? 'active' : ''}
                        disabled={submitting || timerRunning}
                        onClick={() => selectEntryMode('manual')}
                    >
                        <FormattedMessage
                            id='solidtime.form.mode.manual'
                            defaultMessage='Manual'
                        />
                    </button>
                    <button
                        type='button'
                        className={entryMode === 'timer' ? 'active' : ''}
                        disabled={submitting}
                        onClick={() => selectEntryMode('timer')}
                    >
                        <FormattedMessage
                            id='solidtime.form.mode.timer'
                            defaultMessage='Timer'
                        />
                    </button>
                </div>
                <button
                    type='button'
                    className='solidtime-add-btn solidtime-add-btn--primary'
                    disabled={submitDisabled}
                    onClick={isTimerMode ? handleTimerAction : handleManualSubmit}
                >
                    {submitLabel}
                </button>
            </div>
        </div>
    );
};

export default TimeEntryForm;
