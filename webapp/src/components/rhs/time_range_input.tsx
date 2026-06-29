import {usePortalPopover} from 'hooks/usePortalPopover';
import React, {useCallback, useState} from 'react';
import {createPortal} from 'react-dom';
import {formatTime, fromUTC, parseTime, toUTCISO} from 'utils/time';

type Props = {
    date: Date;
    startTime: string;
    endTime: string;
    onChange: (date: Date, startTime: string, endTime: string) => void;
    disabled?: boolean;
};

const CALENDAR_WIDTH = 220;

const DatePicker: React.FC<{date: Date; onChange: (d: Date) => void}> = ({date, onChange}) => {
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
                    onClick={() => setView(new Date(year, month - 1, 1))}
                >◄</button>
                <span>{view.toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</span>
                <button
                    type='button'
                    onClick={() => setView(new Date(year, month + 1, 1))}
                >►</button>
            </div>
            <div className='solidtime-cal-grid'>{cells}</div>
        </div>,
        document.body,
    );

    return (
        <div
            className='solidtime-date-picker'
            ref={triggerRef}
        >
            <button
                type='button'
                className='solidtime-cal-trigger'
                onClick={() => setOpen(!open)}
                aria-label='Pick date'
            >
                📅
            </button>
            {popover}
        </div>
    );
};

const TimeRangeInput: React.FC<Props> = ({date, startTime, endTime, onChange, disabled}) => {
    const updateStart = (v: string) => onChange(date, v, endTime);
    const updateEnd = (v: string) => onChange(date, startTime, v);
    const updateDate = (d: Date) => onChange(d, startTime, endTime);

    return (
        <div className='solidtime-time-range'>
            <input
                className='solidtime-time-input'
                value={startTime}
                disabled={disabled}
                onChange={(e) => updateStart(e.target.value)}
                onBlur={(e) => {
                    if (!parseTime(e.target.value)) {
                        updateStart(startTime);
                    }
                }}
                aria-label='Start time'
            />
            <span> - </span>
            <input
                className='solidtime-time-input'
                value={endTime}
                disabled={disabled}
                onChange={(e) => updateEnd(e.target.value)}
                onBlur={(e) => {
                    if (!parseTime(e.target.value)) {
                        updateEnd(endTime);
                    }
                }}
                aria-label='End time'
            />
            <DatePicker
                date={date}
                onChange={updateDate}
            />
        </div>
    );
};

export default TimeRangeInput;
export {toUTCISO, fromUTC, formatTime, parseTime};
