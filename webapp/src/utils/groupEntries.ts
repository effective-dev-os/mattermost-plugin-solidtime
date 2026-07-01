import type {TimeEntry} from 'types/solidtime';

import {isSameDay} from './dates';
import {durationFromRange} from './time';

export type DayGroup = {
    label: string;
    dateKey: string;
    totalSeconds: number;
    entries: TimeEntry[];
};

function entryDurationSeconds(entry: TimeEntry): number {
    if (entry.duration != null) {
        return entry.duration;
    }
    if (entry.end) {
        return durationFromRange(entry.start, entry.end);
    }
    return 0;
}

export type GroupEntriesOptions = {
    todayLabel: string;
    yesterdayLabel: string;
    locale: string;
};

export function groupEntriesByDay(entries: TimeEntry[], options: GroupEntriesOptions): DayGroup[] {
    const {todayLabel, yesterdayLabel, locale} = options;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const map = new Map<string, DayGroup>();

    for (const entry of entries) {
        const d = new Date(entry.start);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map.has(dateKey)) {
            let label: string;
            if (isSameDay(d, today)) {
                label = todayLabel;
            } else if (isSameDay(d, yesterday)) {
                label = yesterdayLabel;
            } else {
                label = d.toLocaleDateString(locale, {weekday: 'short', month: 'short', day: 'numeric'});
            }
            map.set(dateKey, {label, dateKey, totalSeconds: 0, entries: []});
        }
        const group = map.get(dateKey)!;
        group.entries.push(entry);
        group.totalSeconds += entryDurationSeconds(entry);
    }

    return Array.from(map.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
