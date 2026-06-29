import {getConnectionStatus, getProjects, getTasks, getTimeEntries, getWeekTotal} from 'api/client';
import {formatPluginError} from 'api/errors';
import {subscribeConnectionState} from 'connection_state';
import React, {useCallback, useEffect, useState} from 'react';
import {getWeekRange, shiftWeek, type WeekRange} from 'utils/dates';

import type {Project, Task, TimeEntry} from 'types/solidtime';

import PaginationFooter from './pagination_footer';
import TimeEntryForm from './time_entry_form';
import TimeEntryList from './time_entry_list';
import WeekTotalBar from './week_total_bar';

import './rhs.scss';

type Props = {
    onError: (message: string) => void;
};

const RHSSidebar: React.FC<Props> = ({onError}) => {
    const [connected, setConnected] = useState(false);
    const [week, setWeek] = useState<WeekRange>(() => getWeekRange());
    const [projects, setProjects] = useState<Project[]>([]);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [weekSeconds, setWeekSeconds] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getConnectionStatus().then(({connected: c}) => setConnected(c)).catch(() => setConnected(false));
        return subscribeConnectionState(setConnected);
    }, []);

    const loadTasks = useCallback(async (projectId: string): Promise<Task[]> => {
        const {tasks} = await getTasks(projectId);
        return tasks;
    }, []);

    const refresh = useCallback(async () => {
        if (!connected) {
            return;
        }
        setLoading(true);
        try {
            const [{entries: list}, {seconds}] = await Promise.all([
                getTimeEntries({start: week.startISO, end: week.endISO}),
                getWeekTotal(week.startISO, week.endISO),
            ]);
            setEntries(list);
            setWeekSeconds(seconds);
        } catch (e) {
            onError(formatPluginError(e));
        } finally {
            setLoading(false);
        }
    }, [connected, week, onError]);

    useEffect(() => {
        if (!connected) {
            return;
        }
        getProjects().then(({projects: p}) => setProjects(p)).catch((e) => onError(formatPluginError(e)));
    }, [connected, onError]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleEntryUpdated = (entry: TimeEntry) => {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
        getWeekTotal(week.startISO, week.endISO).
            then(({seconds}) => setWeekSeconds(seconds)).
            catch((e) => onError(formatPluginError(e)));
    };

    if (!connected) {
        return (
            <div className='solidtime-sidebar solidtime-disconnected'>
                <p>Run <code>/solidtime connect &lt;api_token&gt;</code> to connect your account.</p>
            </div>
        );
    }

    return (
        <div className='solidtime-sidebar'>
            <TimeEntryForm
                projects={projects}
                loadTasks={loadTasks}
                onCreated={refresh}
                onError={onError}
            />
            <WeekTotalBar seconds={weekSeconds}/>
            <div className='solidtime-list-area'>
                <TimeEntryList
                    entries={entries}
                    projects={projects}
                    loading={loading}
                    loadTasks={loadTasks}
                    onEntryUpdated={handleEntryUpdated}
                    onError={onError}
                />
            </div>
            <PaginationFooter
                week={week}
                onPrev={() => setWeek((w) => shiftWeek(w, -1))}
                onNext={() => setWeek((w) => shiftWeek(w, 1))}
            />
        </div>
    );
};

export default RHSSidebar;
