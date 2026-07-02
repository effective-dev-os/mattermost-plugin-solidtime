import {deleteTimeEntry, updateTimeEntry} from 'api/client';
import {handlePluginApiError} from 'api/errors';
import React, {useRef, useState} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {durationFromRange, formatDuration, fromUTC, parseTime, toUTCISO} from 'utils/time';

import type {Project, TimeEntry} from 'types/solidtime';

import ProjectSelector from './project_selector';
import TimeRangeInput from './time_range_input';

type Props = {
    entry: TimeEntry;
    projects: Project[];
    onUpdated: (entry: TimeEntry) => void;
    onDeleted: (entryId: string) => void;
    onError: (message: string) => void;
    onConnectionLost: () => void;
    userId?: string;
};

const TimeEntryCard: React.FC<Props> = ({
    entry,
    projects,
    onUpdated,
    onDeleted,
    onError,
    onConnectionLost,
    userId,
}) => {
    const intl = useIntl();
    const startParsed = fromUTC(entry.start);
    const endParsed = entry.end ? fromUTC(entry.end) : startParsed;

    const [saved, setSaved] = useState(entry);
    const [description, setDescription] = useState(entry.description || '');
    const [projectId, setProjectId] = useState(entry.project_id);
    const [taskId, setTaskId] = useState(entry.task_id);
    const [billable, setBillable] = useState(entry.billable);
    const [date, setDate] = useState(startParsed.date);
    const [startTime, setStartTime] = useState(
        `${String(startParsed.hours).padStart(2, '0')}:${String(startParsed.minutes).padStart(2, '0')}`,
    );
    const [endTime, setEndTime] = useState(
        `${String(endParsed.hours).padStart(2, '0')}:${String(endParsed.minutes).padStart(2, '0')}`,
    );
    const [saving, setSaving] = useState(false);
    const descriptionAtFocusRef = useRef(description);

    const duration = saved.end ?
        formatDuration(saved.duration ?? durationFromRange(saved.start, saved.end)) :
        '00:00';

    const revertFromSaved = (source: TimeEntry) => {
        const start = fromUTC(source.start);
        const end = source.end ? fromUTC(source.end) : start;
        setDescription(source.description || '');
        setProjectId(source.project_id);
        setTaskId(source.task_id);
        setBillable(source.billable);
        setDate(start.date);
        setStartTime(`${String(start.hours).padStart(2, '0')}:${String(start.minutes).padStart(2, '0')}`);
        setEndTime(`${String(end.hours).padStart(2, '0')}:${String(end.minutes).padStart(2, '0')}`);
    };

    const save = async (patch: Record<string, unknown>) => {
        setSaving(true);
        try {
            const updated = await updateTimeEntry(saved.id, patch);
            setSaved(updated);
            onUpdated(updated);
        } catch (e) {
            handlePluginApiError(e, onConnectionLost, onError, intl);
            revertFromSaved(saved);
        } finally {
            setSaving(false);
        }
    };

    const handleTimeChange = (d: Date, start: string, end: string) => {
        setDate(d);
        setStartTime(start);
        setEndTime(end);
    };

    const commitDescription = () => {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            if (description !== descriptionAtFocusRef.current) {
                onError(intl.formatMessage({
                    id: 'solidtime.form.validation.description_required',
                    defaultMessage: 'Please enter a description',
                }));
            }
            setDescription(descriptionAtFocusRef.current);
            return;
        }
        if (trimmedDescription !== (saved.description || '')) {
            save({description: trimmedDescription});
        }
    };

    const commitTime = async (d: Date, start: string, end: string) => {
        const sp = parseTime(start);
        const ep = parseTime(end);
        if (!sp || !ep) {
            revertFromSaved(saved);
            return;
        }
        const startISO = toUTCISO(d, sp.hours, sp.minutes);
        const endISO = toUTCISO(d, ep.hours, ep.minutes);
        if (new Date(endISO) <= new Date(startISO)) {
            onError(intl.formatMessage({
                id: 'solidtime.form.validation.end_after_start',
                defaultMessage: 'End time must be after start time',
            }));
            revertFromSaved(saved);
            return;
        }
        if (startISO === saved.start && endISO === saved.end) {
            return;
        }
        await save({start: startISO, end: endISO});
    };

    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleDeleteCancel = () => setConfirmDelete(false);

    const handleDeleteClick = () => setConfirmDelete(true);

    const handleDeleteConfirm = async () => {
        setConfirmDelete(false);
        setSaving(true);
        try {
            await deleteTimeEntry(saved.id);
            onDeleted(saved.id);
        } catch (e) {
            handlePluginApiError(e, onConnectionLost, onError, intl);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`solidtime-entry-card ${saving ? 'saving' : ''}`}>
            <div className='solidtime-entry-top'>
                <input
                    className='solidtime-description'
                    value={description}
                    disabled={saving}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => {
                        descriptionAtFocusRef.current = description;
                    }}
                    onBlur={commitDescription}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            commitDescription();
                        }
                    }}
                    placeholder={intl.formatMessage({
                        id: 'solidtime.form.description_placeholder',
                        defaultMessage: 'What have you worked on?',
                    })}
                />
                <span className='solidtime-duration'>{duration}</span>
                {confirmDelete ? (
                    <>
                        <button
                            type='button'
                            className='solidtime-delete-btn solidtime-delete-confirm'
                            disabled={saving}
                            onClick={handleDeleteConfirm}
                            aria-label={intl.formatMessage({
                                id: 'solidtime.entry.confirm_delete',
                                defaultMessage: 'Confirm delete',
                            })}
                        >
                            <FormattedMessage
                                id='solidtime.entry.ok'
                                defaultMessage='OK'
                            />
                        </button>
                        <button
                            type='button'
                            className='solidtime-delete-btn solidtime-delete-cancel'
                            disabled={saving}
                            onClick={handleDeleteCancel}
                            aria-label={intl.formatMessage({
                                id: 'solidtime.entry.cancel_delete',
                                defaultMessage: 'Cancel delete',
                            })}
                        >
                            ×
                        </button>
                    </>
                ) : (
                    <button
                        type='button'
                        className='solidtime-delete-btn'
                        disabled={saving}
                        onClick={handleDeleteClick}
                        aria-label={intl.formatMessage({
                            id: 'solidtime.entry.delete',
                            defaultMessage: 'Delete entry',
                        })}
                    >
                        ×
                    </button>
                )}
            </div>
            <div className='solidtime-entry-bottom'>
                <ProjectSelector
                    projects={projects}
                    selectedProjectId={projectId}
                    selectedTaskId={taskId}
                    userId={userId}
                    compact={true}
                    onSelect={async (pid, tid, isBillable) => {
                        setProjectId(pid);
                        setTaskId(tid);
                        setBillable(isBillable);
                        await save({project_id: pid, task_id: tid, billable: isBillable});
                    }}
                />
                <button
                    type='button'
                    className={`solidtime-billable ${billable ? 'active' : ''}`}
                    disabled={saving}
                    onClick={() => {
                        const next = !billable;
                        setBillable(next);
                        save({billable: next});
                    }}
                >
                    $
                </button>
                <TimeRangeInput
                    date={date}
                    startTime={startTime}
                    endTime={endTime}
                    disabled={saving}
                    onChange={handleTimeChange}
                    onCommit={commitTime}
                />
            </div>
        </div>
    );
};

export default TimeEntryCard;
