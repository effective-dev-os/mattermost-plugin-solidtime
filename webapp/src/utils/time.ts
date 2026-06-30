export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatElapsed(startISO: string, now = Date.now()): string {
    const seconds = Math.max(0, Math.floor((now - new Date(startISO).getTime()) / 1000));
    return formatDuration(seconds);
}

export function parseTime(value: string): {hours: number; minutes: number} | null {
    const match = (/^(\d{1,2}):(\d{2})$/).exec(value.trim());
    if (!match) {
        return null;
    }
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours > 23 || minutes > 59) {
        return null;
    }
    return {hours, minutes};
}

export function formatTime(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatSolidtimeUTC(d: Date): string {
    // Solidtime API: Y-m-d\TH:i:s\Z — no fractional seconds
    return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function toUTCISO(date: Date, hours: number, minutes: number): string {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return formatSolidtimeUTC(d);
}

export function fromUTC(iso: string): {date: Date; hours: number; minutes: number} {
    const d = new Date(iso);
    return {
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        hours: d.getHours(),
        minutes: d.getMinutes(),
    };
}

export function durationFromRange(startISO: string, endISO: string): number {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    return Math.max(0, Math.floor((end - start) / 1000));
}

export function defaultFormTimes(now = new Date()): {start: string; end: string} {
    const start = new Date(now);
    start.setMinutes(Math.floor(start.getMinutes() / 5) * 5, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);
    return {start: formatTime(start), end: formatTime(end)};
}
