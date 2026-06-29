import {updateTimeEntry} from 'api/client';
import {formatPluginError} from 'api/errors';
import React, {useState} from 'react';
import {durationFromRange, formatDuration, fromUTC, parseTime, toUTCISO} from 'utils/time';

import type {Project, Task, TimeEntry} from 'types/solidtime';

import ProjectSelector from './project_selector';
import TimeRangeInput from './time_range_input';

type Props = {
    entry: TimeEntry;
    projects: Project[];
    loadTasks: (projectId: string) => Promise<Task[]>;
    onUpdated: (entry: TimeEntry) => void;
    onError: (message: string) => void;
};

const TimeEntryCard: React.FC<Props> = ({entry, projects, loadTasks, onUpdated, onError}) => {
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

    const duration = saved.end ?
        formatDuration(saved.duration ?? durationFromRange(saved.start, saved.end)) :
        '00:00:00';

    const save = async (patch: Record<string, unknown>) => {
        setSaving(true);
        try {
            const updated = await updateTimeEntry(saved.id, patch);
            setSaved(updated);
            onUpdated(updated);
        } catch (e) {
            onError(formatPluginError(e));
            setDescription(saved.description || '');
        } finally {
            setSaving(false);
        }
    };

    const saveTime = async (d: Date, start: string, end: string) => {
        setDate(d);
        setStartTime(start);
        setEndTime(end);
        const sp = parseTime(start);
        const ep = parseTime(end);
        if (!sp || !ep) {
            return;
        }
        const startISO = toUTCISO(d, sp.hours, sp.minutes);
        const endISO = toUTCISO(d, ep.hours, ep.minutes);
        if (new Date(endISO) <= new Date(startISO)) {
            onError('End time must be after start time');
            return;
        }
        await save({start: startISO, end: endISO});
    };

    return (
        <div className={`solidtime-entry-card ${saving ? 'saving' : ''}`}>
            <div className='solidtime-entry-top'>
                <input
                    className='solidtime-description'
                    value={description}
                    disabled={saving}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => {
                        if (description !== (saved.description || '')) {
                            save({description: description || null});
                        }
                    }}
                    placeholder='What have you worked on?'
                />
                <span className='solidtime-duration'>{duration}</span>
            </div>
            <div className='solidtime-entry-bottom'>
                <ProjectSelector
                    projects={projects}
                    selectedProjectId={projectId}
                    selectedTaskId={taskId}
                    loadTasks={loadTasks}
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
                    onChange={saveTime}
                />
            </div>
        </div>
    );
};

export default TimeEntryCard;
