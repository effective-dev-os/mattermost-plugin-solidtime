import {getActiveTimeEntry, updateTimeEntry} from 'api/client';
import {handlePluginApiError, isNotConnectedError} from 'api/errors';
import React, {useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {setActiveTimer} from 'reducer';
import {formatElapsed, formatSolidtimeUTC} from 'utils/time';

import type {GlobalState} from '@mattermost/types/store';

import {getPluginState} from 'selectors';

import SolidtimeIcon from 'components/channel_header_button';

import './rhs/rhs.scss';

type Props = {
    onToggleRHS: () => void;
    onError: (message: string) => void;
    onConnectionLost: () => void;
};

const ChannelHeaderTimer: React.FC<Props> = ({onToggleRHS, onError, onConnectionLost}) => {
    const intl = useIntl();
    const dispatch = useDispatch();
    const activeTimer = useSelector((state: GlobalState) => getPluginState(state).activeTimer);
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!activeTimer) {
            return undefined;
        }
        const id = window.setInterval(() => setTick((t) => t + 1), 1000);
        return () => window.clearInterval(id);
    }, [activeTimer]);

    const handleStop = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeTimer) {
            return;
        }
        try {
            await updateTimeEntry(activeTimer.id, {end: formatSolidtimeUTC(new Date())});
            dispatch(setActiveTimer(null));
        } catch (err) {
            handlePluginApiError(err, onConnectionLost, onError, intl);
        }
    };

    const handleToggleRhs = (e: React.MouseEvent) => {
        // ponytail: Mattermost ChannelHeaderPlug ignores plugin header clicks for 1s after RHS close
        e.stopPropagation();
        onToggleRHS();
    };

    if (!activeTimer) {
        return (
            <span
                className='solidtime-header-icon'
                role='presentation'
                onClick={handleToggleRhs}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <SolidtimeIcon/>
            </span>
        );
    }

    return (
        <div
            className='solidtime-header-timer'
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role='presentation'
        >
            <button
                type='button'
                className='solidtime-header-stop'
                onClick={handleStop}
                aria-label={intl.formatMessage({
                    id: 'solidtime.timer.stop',
                    defaultMessage: 'Stop timer',
                })}
            >
                <svg
                    width='14'
                    height='14'
                    viewBox='0 0 14 14'
                    aria-hidden='true'
                >
                    <rect
                        x='2'
                        y='2'
                        width='10'
                        height='10'
                        rx='1.5'
                        fill='currentColor'
                    />
                </svg>
            </button>
            <button
                type='button'
                className='solidtime-header-elapsed'
                onClick={onToggleRHS}
                aria-label={intl.formatMessage({
                    id: 'solidtime.header.toggle',
                    defaultMessage: 'Toggle Solidtime',
                })}
            >
                {formatElapsed(activeTimer.start)}
            </button>
        </div>
    );
};

export const refreshActiveTimer = async (
    dispatch: (action: ReturnType<typeof setActiveTimer>) => void,
    onConnectionLost?: () => void,
): Promise<void> => {
    try {
        const {active} = await getActiveTimeEntry();
        dispatch(setActiveTimer(active));
    } catch (err) {
        if (isNotConnectedError(err)) {
            onConnectionLost?.();
            return;
        }
        dispatch(setActiveTimer(null));
    }
};

export function createChannelHeaderButton(
    onToggleRHS: () => void,
    onError: (message: string) => void,
    onConnectionLost: () => void,
): React.ComponentType {
    return () => (
        <ChannelHeaderTimer
            onToggleRHS={onToggleRHS}
            onError={onError}
            onConnectionLost={onConnectionLost}
        />
    );
}
