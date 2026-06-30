import {usePortalPopover} from 'hooks/usePortalPopover';
import React, {useCallback, useState} from 'react';
import {createPortal} from 'react-dom';
import {useIntl} from 'react-intl';
import {formatParsedTime, parseTime} from 'utils/time';

type Props = {
    date: Date;
    startTime: string;
    endTime: string;
    onChange: (date: Date, startTime: string, endTime: string) => void;
    onCommit?: (date: Date, startTime: string, endTime: string) => void;
    disabled?: boolean;
    variant?: 'default' | 'panel';
};

const CALENDAR_WIDTH = 220;

const DatePicker: React.FC<{date: Date; onChange: (d: Date) => void; panel?: boolean; locale: string}> = ({date, onChange, panel, locale}) => {
    const intl = useIntl();
    const [view, setView] = useState(new Date(date.getFullYear(), date.getMonth(), 1));
    const [open, setOpen] = useState(false);
    const close = useCallback(() => setOpen(false), []);
    const {triggerRef, popoverRef, style} = usePortalPopover(open, close, {
        width: CALENDAR_WIDTH,
        minSpaceBelow: 200,
        maxHeight: 260,
    });

    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
        cells.push(
            <span
                key={`e${i}`}
                className='solidtime-cal-empty'
            />,
        );
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(year, month, d);
        const isToday = cellDate.toDateString() === new Date().toDateString();
        const isSelected = cellDate.toDateString() === date.toDateString();
        cells.push(
            <button
                key={d}
                type='button'
                className={`solidtime-cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => {
                    onChange(cellDate);
                    setOpen(false);
                }}
            >
                {d}
            </button>,
        );
    }

    const popover = open && style && createPortal(
        <div
            ref={popoverRef}
            className='solidtime-cal-popover'
            style={style}
        >
            <div className='solidtime-cal-nav'>
                <button
                    type='button'
                    className='solidtime-cal-nav-btn'
                    onClick={() => setView(new Date(year, month - 1, 1))}
                    aria-label={intl.formatMessage({
                        id: 'solidtime.calendar.prev_month',
                        defaultMessage: 'Previous month',
                    })}
                >
                    <span
                        className='solidtime-nav-chevron solidtime-nav-chevron--left'
                        aria-hidden='true'
                    />
                </button>
                <span className='solidtime-cal-nav-label'>
                    {view.toLocaleDateString(locale, {month: 'short', year: 'numeric'})}
                </span>
                <button
                    type='button'
                    className='solidtime-cal-nav-btn'
                    onClick={() => setView(new Date(year, month + 1, 1))}
                    aria-label={intl.formatMessage({
                        id: 'solidtime.calendar.next_month',
                        defaultMessage: 'Next month',
                    })}
                >
                    <span
                        className='solidtime-nav-chevron solidtime-nav-chevron--right'
                        aria-hidden='true'
                    />
                </button>
            </div>
            <div className='solidtime-cal-grid'>{cells}</div>
        </div>,
        document.body,
    );

    const dateLabel = date.toLocaleDateString(locale, {month: 'short', day: 'numeric'});

    return (
        <div
            className='solidtime-date-picker'
            ref={triggerRef}
        >
            <button
                type='button'
                className={`solidtime-cal-trigger ${panel ? 'solidtime-cal-trigger--panel' : ''}`}
                onClick={() => setOpen(!open)}
                aria-label={intl.formatMessage({
                    id: 'solidtime.calendar.pick_date',
                    defaultMessage: 'Pick date',
                })}
                title={panel ? dateLabel : undefined}
            >
                {panel ? (
                    <>
                        <span
                            className='solidtime-cal-trigger-icon'
                            aria-hidden='true'
                        >
                            📅
                        </span>
                        <span className='solidtime-cal-trigger-date'>{dateLabel}</span>
                    </>
                ) : (
                    '📅'
                )}
            </button>
            {popover}
        </div>
    );
};

const TimeRangeInput: React.FC<Props> = ({date, startTime, endTime, onChange, onCommit, disabled, variant = 'default'}) => {
    const intl = useIntl();
    const updateStart = (v: string) => onChange(date, v, endTime);
    const updateEnd = (v: string) => onChange(date, startTime, v);
    const updateDate = (d: Date) => {
        onChange(d, startTime, endTime);
        onCommit?.(d, startTime, endTime);
    };

    const blurStart = (value: string) => {
        const parsed = parseTime(value);
        const next = parsed ? formatParsedTime(parsed) : startTime;
        onChange(date, next, endTime);
        if (parsed) {
            onCommit?.(date, next, endTime);
        }
    };

    const blurEnd = (value: string) => {
        const parsed = parseTime(value);
        const next = parsed ? formatParsedTime(parsed) : endTime;
        onChange(date, startTime, next);
        if (parsed) {
            onCommit?.(date, startTime, next);
        }
    };

    const panel = variant === 'panel';

    return (
        <div className={`solidtime-time-range ${panel ? 'solidtime-time-range--panel' : ''}`}>
            <input
                className='solidtime-time-input'
                value={startTime}
                disabled={disabled}
                onChange={(e) => updateStart(e.target.value)}
                onBlur={(e) => blurStart(e.target.value)}
                aria-label={intl.formatMessage({
                    id: 'solidtime.time.start',
                    defaultMessage: 'Start time',
                })}
            />
            <span> - </span>
            <input
                className='solidtime-time-input'
                value={endTime}
                disabled={disabled}
                onChange={(e) => updateEnd(e.target.value)}
                onBlur={(e) => blurEnd(e.target.value)}
                aria-label={intl.formatMessage({
                    id: 'solidtime.time.end',
                    defaultMessage: 'End time',
                })}
            />
            <DatePicker
                date={date}
                onChange={updateDate}
                panel={panel}
                locale={intl.locale}
            />
        </div>
    );
};

export default TimeRangeInput;
