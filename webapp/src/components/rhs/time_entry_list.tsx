import React from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useSelector} from 'react-redux';
import {groupEntriesByDay} from 'utils/groupEntries';
import {formatDuration} from 'utils/time';

import type {GlobalState} from '@mattermost/types/store';

import type {Project, Task, TimeEntry} from 'types/solidtime';

import TimeEntryCard from './time_entry_card';

type Props = {
    entries: TimeEntry[];
    projects: Project[];
    loading: boolean;
    loadTasks: (projectId: string) => Promise<Task[]>;
    onEntryUpdated: (entry: TimeEntry) => void;
    onEntryDeleted: (entryId: string) => void;
    onError: (message: string) => void;
    onConnectionLost: () => void;
};

const TimeEntryList: React.FC<Props> = ({
    entries,
    projects,
    loading,
    loadTasks,
    onEntryUpdated,
    onEntryDeleted,
    onError,
    onConnectionLost,
}) => {
    const intl = useIntl();
    const userId = useSelector((state: GlobalState) => state.entities.users.currentUserId);

    if (loading) {
        return (
            <div className='solidtime-list-loading'>
                <FormattedMessage
                    id='solidtime.list.loading'
                    defaultMessage='Loading...'
                />
            </div>
        );
    }
    if (entries.length === 0) {
        return (
            <div className='solidtime-list-empty'>
                <FormattedMessage
                    id='solidtime.list.empty'
                    defaultMessage='No time entries for this period'
                />
            </div>
        );
    }

    const groups = groupEntriesByDay(entries, {
        todayLabel: intl.formatMessage({id: 'solidtime.day.today', defaultMessage: 'Today'}),
        yesterdayLabel: intl.formatMessage({id: 'solidtime.day.yesterday', defaultMessage: 'Yesterday'}),
        locale: intl.locale,
    });

    return (
        <div className='solidtime-entry-list'>
            {groups.map((group) => (
                <div
                    key={group.dateKey}
                    className='solidtime-day-group'
                >
                    <div className='solidtime-day-header'>
                        <span className='solidtime-day-header__label'>{group.label}</span>
                        <span className='solidtime-day-header__total'>{formatDuration(group.totalSeconds)}</span>
                    </div>
                    {group.entries.map((entry) => (
                        <TimeEntryCard
                            key={entry.id}
                            entry={entry}
                            projects={projects}
                            loadTasks={loadTasks}
                            onUpdated={onEntryUpdated}
                            onDeleted={onEntryDeleted}
                            onError={onError}
                            onConnectionLost={onConnectionLost}
                            userId={userId}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TimeEntryList;
