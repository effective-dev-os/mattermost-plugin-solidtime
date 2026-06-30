import {createTimeEntry, updateTimeEntry} from 'api/client';
import {handlePluginApiError} from 'api/errors';
import React, {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setActiveTimer, setEntryMode, type EntryMode} from 'reducer';
import {loadEntryMode, saveEntryMode} from 'utils/entry_mode';
import {
    defaultFormTimes,
    formatElapsed,
    formatSolidtimeUTC,
    parseTime,
    toUTCISO,
} from 'utils/time';

import type {GlobalState} from '@mattermost/types/store';

import {getPluginState} from 'selectors';

import type {CreateTimeEntryRequest, Project, Task} from 'types/solidtime';

import ProjectSelector from './project_selector';
import TimeRangeInput from './time_range_input';

type Props = {
    projects: Project[];
    loadTasks: (projectId: string) => Promise<Task[]>;
    onCreated: () => void;
    onError: (message: string) => void;
    onConnectionLost: () => void;
};

const TimeEntryForm: React.FC<Props> = ({projects, loadTasks, onCreated, onError, onConnectionLost}) => {
    const dispatch = useDispatch();
    const {activeTimer, entryMode} = useSelector((state: GlobalState) => getPluginState(state));
    const userId = useSelector((state: GlobalState) => state.entities.users.currentUserId);

    const defaults = defaultFormTimes();
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [billable, setBillable] = useState(true);
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(defaults.start);
    const [endTime, setEndTime] = useState(defaults.end);
    const [submitting, setSubmitting] = useState(false);
    const [elapsedTick, setElapsedTick] = useState(0);
    const modeRestored = useRef(false);

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
        setDate(d);
        setStartTime(start);
        setEndTime(end);
    };

    const handleManualSubmit = async () => {
        if (!projectId) {
            onError('Please select a project');
            return;
        }
        const startParts = parseTime(startTime);
        const endParts = parseTime(endTime);
        if (!startParts || !endParts) {
            onError('Invalid time format');
            return;
        }
        const startISO = toUTCISO(date, startParts.hours, startParts.minutes);
        const endISO = toUTCISO(date, endParts.hours, endParts.minutes);
        if (new Date(endISO) <= new Date(startISO)) {
            onError('End time must be after start time');
            return;
        }

        setSubmitting(true);
        try {
            const payload: CreateTimeEntryRequest = {
                description: description || null,
                project_id: projectId,
                start: startISO,
                end: endISO,
                billable,
            };
            if (taskId) {
                payload.task_id = taskId;
            }
            await createTimeEntry(payload);
            setDescription('');
            setTaskId(null);
            const fresh = defaultFormTimes();
            setStartTime(fresh.start);
            setEndTime(fresh.end);
            setDate(new Date());
            onCreated();
        } catch (e) {
            handlePluginApiError(e, onConnectionLost, onError);
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
                if (!projectId) {
                    onError('Please select a project');
                    return;
                }
                const payload: CreateTimeEntryRequest = {
                    description: description || null,
                    project_id: projectId,
                    start: formatSolidtimeUTC(new Date()),
                    end: null,
                    billable,
                };
                if (taskId) {
                    payload.task_id = taskId;
                }
                const entry = await createTimeEntry(payload);
                dispatch(setActiveTimer(entry));
            }
        } catch (e) {
            handlePluginApiError(e, onConnectionLost, onError);
        } finally {
            setSubmitting(false);
        }
    };

    const timerDisplay = activeTimer ?
        formatElapsed(activeTimer.start) :
        '00:00';

    let submitLabel = 'Add entry';
    if (isTimerMode) {
        submitLabel = timerRunning ? 'Stop timer' : 'Start timer';
    }

    const submitDisabled = submitting || (isTimerMode ? (!timerRunning && !projectId) : !projectId);

    return (
        <div className='solidtime-form'>
            <div className='solidtime-form-stack'>
                <label className='solidtime-field'>
                    <span className='solidtime-field-label'>Description</span>
                    <input
                        className='solidtime-field-control'
                        placeholder='What have you worked on?'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={submitting}
                    />
                </label>

                <div className='solidtime-form-row-fields'>
                    <label className='solidtime-field solidtime-field--project'>
                        <span className='solidtime-field-label'>
                            Project
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
                            loadTasks={loadTasks}
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
                            {isTimerMode ? 'Elapsed' : 'Time'}
                        </span>
                        <div className='solidtime-time-panel'>
                            <button
                                type='button'
                                className={`solidtime-billable solidtime-billable--panel ${billable ? 'active' : ''}`}
                                onClick={() => setBillable(!billable)}
                                aria-label='Toggle billable'
                                aria-pressed={billable}
                                disabled={submitting}
                                title={billable ? 'Billable' : 'Non-billable'}
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
                    aria-label='Entry mode'
                >
                    <button
                        type='button'
                        className={entryMode === 'manual' ? 'active' : ''}
                        disabled={submitting || timerRunning}
                        onClick={() => selectEntryMode('manual')}
                    >
                        Manual
                    </button>
                    <button
                        type='button'
                        className={entryMode === 'timer' ? 'active' : ''}
                        disabled={submitting}
                        onClick={() => selectEntryMode('timer')}
                    >
                        Timer
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
