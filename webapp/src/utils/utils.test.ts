import {groupEntriesByDay} from 'utils/groupEntries';
import {formatDuration, formatSolidtimeUTC, parseTime, toUTCISO} from 'utils/time';

describe('time utils', () => {
    test('formatDuration', () => {
        expect(formatDuration(3661)).toBe('01:01:01');
    });

    test('parseTime', () => {
        expect(parseTime('09:30')).toEqual({hours: 9, minutes: 30});
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
        }]);
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
        ]);
        expect(groups[0].dateKey).toBe('2026-10-15');
        expect(groups[1].dateKey).toBe('2026-06-01');
    });
});
