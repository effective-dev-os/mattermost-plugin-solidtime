import React from 'react';
import {groupEntriesByDay} from 'utils/groupEntries';

import type {Project, Task, TimeEntry} from 'types/solidtime';

import TimeEntryCard from './time_entry_card';

type Props = {
    entries: TimeEntry[];
    projects: Project[];
    loading: boolean;
    loadTasks: (projectId: string) => Promise<Task[]>;
    onEntryUpdated: (entry: TimeEntry) => void;
    onError: (message: string) => void;
};

const TimeEntryList: React.FC<Props> = ({entries, projects, loading, loadTasks, onEntryUpdated, onError}) => {
    if (loading) {
        return <div className='solidtime-list-loading'>Loading...</div>;
    }
    if (entries.length === 0) {
        return <div className='solidtime-list-empty'>No time entries for this period</div>;
    }

    const groups = groupEntriesByDay(entries);

    return (
        <div className='solidtime-entry-list'>
            {groups.map((group) => (
                <div
                    key={group.dateKey}
                    className='solidtime-day-group'
                >
                    <div className='solidtime-day-header'>{group.label}</div>
                    {group.entries.map((entry) => (
                        <TimeEntryCard
                            key={entry.id}
                            entry={entry}
                            projects={projects}
                            loadTasks={loadTasks}
                            onUpdated={onEntryUpdated}
                            onError={onError}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TimeEntryList;
