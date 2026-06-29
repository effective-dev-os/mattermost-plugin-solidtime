import {createTimeEntry} from 'api/client';
import {formatPluginError} from 'api/errors';
import React, {useState} from 'react';
import {defaultFormTimes, parseTime, toUTCISO} from 'utils/time';

import type {CreateTimeEntryRequest, Project, Task} from 'types/solidtime';

import ProjectSelector from './project_selector';
import TimeRangeInput from './time_range_input';

type Props = {
    projects: Project[];
    loadTasks: (projectId: string) => Promise<Task[]>;
    onCreated: () => void;
    onError: (message: string) => void;
};

const TimeEntryForm: React.FC<Props> = ({projects, loadTasks, onCreated, onError}) => {
    const defaults = defaultFormTimes();
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [billable, setBillable] = useState(true);
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(defaults.start);
    const [endTime, setEndTime] = useState(defaults.end);
    const [submitting, setSubmitting] = useState(false);

    const handleTimeChange = (d: Date, start: string, end: string) => {
        setDate(d);
        setStartTime(start);
        setEndTime(end);
    };

    const handleSubmit = async () => {
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
            onError(formatPluginError(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='solidtime-form'>
            <div className='solidtime-form-row'>
                <input
                    className='solidtime-description'
                    placeholder='What have you worked on?'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <ProjectSelector
                    projects={projects}
                    selectedProjectId={projectId}
                    selectedTaskId={taskId}
                    loadTasks={loadTasks}
                    onSelect={(pid, tid, isBillable) => {
                        setProjectId(pid);
                        setTaskId(tid);
                        setBillable(isBillable);
                    }}
                />
            </div>
            <div className='solidtime-form-row solidtime-form-meta'>
                <button
                    type='button'
                    className={`solidtime-billable ${billable ? 'active' : ''}`}
                    onClick={() => setBillable(!billable)}
                    aria-label='Toggle billable'
                >
                    $
                </button>
                <span className='solidtime-divider'/>
                <TimeRangeInput
                    date={date}
                    startTime={startTime}
                    endTime={endTime}
                    onChange={handleTimeChange}
                    disabled={submitting}
                />
                <span className='solidtime-divider'/>
                <button
                    type='button'
                    className='solidtime-add-btn'
                    disabled={!projectId || submitting}
                    onClick={handleSubmit}
                >
                    ADD
                </button>
                <span className='solidtime-divider'/>
                <button
                    type='button'
                    className='solidtime-menu-btn'
                    disabled={true}
                    aria-label='More options'
                >
                    ⋮
                </button>
            </div>
        </div>
    );
};

export default TimeEntryForm;
