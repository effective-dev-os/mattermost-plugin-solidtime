import {groupEntriesByDay} from 'utils/groupEntries';
import {formatDuration, formatElapsed, formatSolidtimeUTC, nextFormTimes, parseTime, toUTCISO} from 'utils/time';

describe('time utils', () => {
    test('formatDuration', () => {
        expect(formatDuration(3661)).toBe('01:01');
    });

    test('parseTime', () => {
        expect(parseTime('09:30')).toEqual({hours: 9, minutes: 30});
        expect(parseTime('2:15')).toEqual({hours: 2, minutes: 15});
        expect(parseTime('2')).toEqual({hours: 2, minutes: 0});
        expect(parseTime('10')).toEqual({hours: 10, minutes: 0});
        expect(parseTime('1.5')).toEqual({hours: 1, minutes: 30});
        expect(parseTime('1,5')).toEqual({hours: 1, minutes: 30});
        expect(parseTime('0:10')).toEqual({hours: 0, minutes: 10});
        expect(parseTime('0.16')).toEqual({hours: 0, minutes: 10});
        expect(parseTime('09:30:45')).toEqual({hours: 9, minutes: 30});
        expect(parseTime('1830')).toEqual({hours: 18, minutes: 30});
        expect(parseTime('930')).toEqual({hours: 9, minutes: 30});
        expect(parseTime('130')).toEqual({hours: 1, minutes: 30});
        expect(parseTime('24:00')).toBeNull();
        expect(parseTime('invalid')).toBeNull();
    });

    test('toUTCISO', () => {
        const d = new Date(2026, 5, 29);
        const iso = toUTCISO(d, 10, 0);
        expect(iso).toContain('T');
        expect(iso).not.toMatch(/\.\d{3}Z$/);
    });

    test('formatSolidtimeUTC strips milliseconds', () => {
        expect(formatSolidtimeUTC(new Date('2026-06-28T21:00:00.000Z'))).toBe('2026-06-28T21:00:00Z');
    });

    test('formatElapsed', () => {
        const start = new Date(Date.now() - 3661000).toISOString();
        expect(formatElapsed(start, Date.now())).toBe('01:01');
    });

    test('nextFormTimes', () => {
        const date = new Date(2026, 5, 30);
        expect(nextFormTimes(date, {hours: 14, minutes: 30}, {hours: 15, minutes: 30})).toEqual({
            date,
            start: '15:30',
            end: '16:30',
        });
        expect(nextFormTimes(date, {hours: 15, minutes: 30}, {hours: 17, minutes: 0})).toEqual({
            date,
            start: '17:00',
            end: '18:30',
        });
        expect(nextFormTimes(date, {hours: 10, minutes: 0}, {hours: 15, minutes: 30})).toEqual({
            date,
            start: '15:30',
            end: '21:00',
        });
    });
});

describe('groupEntriesByDay', () => {
    test('labels today', () => {
        const now = new Date();
        const groups = groupEntriesByDay([{
            id: '1',
            start: now.toISOString(),
            end: now.toISOString(),
            duration: 3600,
            description: 'test',
            task_id: null,
            project_id: null,
            organization_id: 'o',
            user_id: 'u',
            billable: true,
        }], {
            todayLabel: 'Today',
            yesterdayLabel: 'Yesterday',
            locale: 'en',
        });
        expect(groups[0].label).toBe('Today');
    });

    test('sorts days newest first', () => {
        const groups = groupEntriesByDay([
            {
                id: '1',
                start: '2026-06-01T10:00:00.000Z',
                end: '2026-06-01T11:00:00.000Z',
                duration: 3600,
                description: 'older',
                task_id: null,
                project_id: null,
                organization_id: 'o',
                user_id: 'u',
                billable: true,
            },
            {
                id: '2',
                start: '2026-10-15T10:00:00.000Z',
                end: '2026-10-15T11:00:00.000Z',
                duration: 3600,
                description: 'newer',
                task_id: null,
                project_id: null,
                organization_id: 'o',
                user_id: 'u',
                billable: true,
            },
        ], {
            todayLabel: 'Today',
            yesterdayLabel: 'Yesterday',
            locale: 'en',
        });
        expect(groups[0].dateKey).toBe('2026-10-15');
        expect(groups[1].dateKey).toBe('2026-06-01');
    });
});
