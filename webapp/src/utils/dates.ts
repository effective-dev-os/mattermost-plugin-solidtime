import {formatSolidtimeUTC} from './time';

export type WeekRange = {
    start: Date;
    end: Date;
    startISO: string;
    endISO: string;
};

function startOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

// ponytail: Monday week start; week_start from /users/me is v2
export function getWeekRange(anchor: Date = new Date()): WeekRange {
    const d = startOfDay(anchor);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return {
        start,
        end,
        startISO: formatSolidtimeUTC(startOfDay(start)),
        endISO: formatSolidtimeUTC(endOfDay(end)),
    };
}

export function shiftWeek(range: WeekRange, deltaWeeks: number): WeekRange {
    const anchor = new Date(range.start);
    anchor.setDate(anchor.getDate() + (deltaWeeks * 7));
    return getWeekRange(anchor);
}

export function formatWeekLabel(range: WeekRange, locale: string): string {
    const opts: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric', year: 'numeric'};
    const a = range.start.toLocaleDateString(locale, opts);
    const b = range.end.toLocaleDateString(locale, opts);
    return `${a} – ${b}`;
}

export function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
