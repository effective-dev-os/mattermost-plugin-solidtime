import {
    getOrganizations,
    getProjects,
    getTasks,
    getTimeEntries,
    getWeekTotal,
} from 'api/client';
import {handlePluginApiError} from 'api/errors';
import {getConnectionState, subscribeConnectionState} from 'connection_state';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setSelectedOrg} from 'reducer';
import {getWeekRange, shiftWeek, type WeekRange} from 'utils/dates';

import type {GlobalState} from '@mattermost/types/store';

import {getPluginState} from 'selectors';

import OrgSelector from 'components/rhs/org_selector';

import type {Organization, Project, Task, TimeEntry} from 'types/solidtime';

import PaginationFooter from './pagination_footer';
import TimeEntryForm from './time_entry_form';
import TimeEntryList from './time_entry_list';
import WeekTotalBar from './week_total_bar';

import './rhs.scss';

type Props = {
    onError: (message: string) => void;
    onConnectionLost: () => void;
    onRhsOpenChange: (open: boolean) => void;
};

const RHSSidebar: React.FC<Props> = ({onError, onConnectionLost, onRhsOpenChange}) => {
    const dispatch = useDispatch();
    const {selectedOrgId, activeTimer} = useSelector((state: GlobalState) => getPluginState(state));
    const prevActiveTimer = useRef(activeTimer);
    const [connected, setConnected] = useState(getConnectionState);
    const [orgsReady, setOrgsReady] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [week, setWeek] = useState<WeekRange>(() => getWeekRange());
    const [projects, setProjects] = useState<Project[]>([]);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [weekSeconds, setWeekSeconds] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => subscribeConnectionState(setConnected), []);

    useEffect(() => {
        onRhsOpenChange(true);
        return () => onRhsOpenChange(false);
    }, [onRhsOpenChange]);

    useEffect(() => {
        if (!connected) {
            setOrgsReady(false);
            setOrganizations([]);
            setProjects([]);
            setEntries([]);
            return undefined;
        }

        let cancelled = false;
        setOrgsReady(false);
        (async () => {
            try {
                const {organizations: orgs, current_id: currentId} = await getOrganizations();
                if (cancelled) {
                    return;
                }
                setOrganizations(orgs);
                dispatch(setSelectedOrg(currentId));
                setOrgsReady(true);
            } catch (e) {
                if (!cancelled) {
                    handlePluginApiError(e, onConnectionLost, onError);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [connected, dispatch, onConnectionLost, onError]);

    const loadTasks = useCallback(async (projectId: string): Promise<Task[]> => {
        const {tasks} = await getTasks(projectId);
        return tasks;
    }, []);

    const refreshWeekTotal = useCallback(async () => {
        if (!selectedOrgId) {
            return;
        }
        try {
            const {seconds} = await getWeekTotal(week.startISO, week.endISO);
            setWeekSeconds(seconds);
        } catch (e) {
            handlePluginApiError(e, onConnectionLost, onError);
        }
    }, [selectedOrgId, week, onConnectionLost, onError]);

    const refreshEntries = useCallback(async () => {
        if (!connected || !orgsReady || !selectedOrgId) {
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
            handlePluginApiError(e, onConnectionLost, onError);
        } finally {
            setLoading(false);
        }
    }, [connected, orgsReady, selectedOrgId, week, onConnectionLost, onError]);

    // Reload projects and entries after orgs are synced with the server.
    useEffect(() => {
        if (!connected || !orgsReady || !selectedOrgId) {
            return undefined;
        }
        let cancelled = false;
        setProjects([]);
        setEntries([]);
        setLoading(true);
        (async () => {
            try {
                const {projects: p} = await getProjects();
                const [{entries: list}, {seconds}] = await Promise.all([
                    getTimeEntries({start: week.startISO, end: week.endISO}),
                    getWeekTotal(week.startISO, week.endISO),
                ]);
                if (cancelled) {
                    return;
                }
                setProjects(p);
                setEntries(list);
                setWeekSeconds(seconds);
            } catch (e) {
                if (!cancelled) {
                    handlePluginApiError(e, onConnectionLost, onError);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [connected, orgsReady, selectedOrgId, week, onConnectionLost, onError]);

    // Refresh list when timer stops (header, form, or WS from another tab).
    useEffect(() => {
        const hadTimer = prevActiveTimer.current;
        prevActiveTimer.current = activeTimer;
        if (hadTimer && !activeTimer && connected && orgsReady && selectedOrgId) {
            refreshEntries();
        }
    }, [activeTimer, connected, orgsReady, selectedOrgId, refreshEntries]);

    const handleEntryUpdated = (entry: TimeEntry) => {
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
        refreshWeekTotal();
    };

    const handleEntryDeleted = (entryId: string) => {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
        refreshWeekTotal();
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
            <OrgSelector
                organizations={organizations}
                currentId={selectedOrgId || ''}
                onChanged={(orgId) => dispatch(setSelectedOrg(orgId))}
                onError={onError}
                onConnectionLost={onConnectionLost}
            />
            <TimeEntryForm
                key={selectedOrgId || 'none'}
                projects={projects}
                loadTasks={loadTasks}
                onCreated={refreshEntries}
                onError={onError}
                onConnectionLost={onConnectionLost}
            />
            <WeekTotalBar seconds={weekSeconds}/>
            <div className='solidtime-list-area'>
                <TimeEntryList
                    entries={entries}
                    projects={projects}
                    loading={loading}
                    loadTasks={loadTasks}
                    onEntryUpdated={handleEntryUpdated}
                    onEntryDeleted={handleEntryDeleted}
                    onError={onError}
                    onConnectionLost={onConnectionLost}
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
