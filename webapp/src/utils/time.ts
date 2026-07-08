export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatElapsed(startISO: string, now = Date.now()): string {
    const seconds = Math.max(0, Math.floor((now - new Date(startISO).getTime()) / 1000));
    return formatDuration(seconds);
}

function validateClockTime(hours: number, minutes: number): {hours: number; minutes: number} | null {
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }
    return {hours, minutes};
}

/** Format parsed clock time as HH:mm (used after blur normalization). */
export function formatParsedTime(parts: {hours: number; minutes: number}): string {
    return `${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}`;
}

/** Strip characters that partial time input never uses (digits, colon, decimal separators). */
export function filterTimeInput(value: string): string {
    return value.replace(/[^\d:.,]/g, '').slice(0, 8);
}

/**
 * Parse partial clock-time input (Solidtime-style):
 * - integers → whole hours (2 → 02:00)
 * - decimals (.,) → fraction of an hour (1.5 → 01:30)
 * - HH:mm and HH:mm:ss → direct
 * - compact HHMM (1830 → 18:30, 930 → 09:30)
 */
export function parseTime(value: string): {hours: number; minutes: number} | null {
    const input = value.trim();
    if (!input) {
        return null;
    }

    const hms = (/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/).exec(input);
    if (hms) {
        const hours = parseInt(hms[1], 10);
        const minutes = parseInt(hms[2], 10);
        const seconds = parseInt(hms[3], 10);
        if (minutes > 59 || seconds > 59) {
            return null;
        }
        return validateClockTime(hours, minutes);
    }

    const hm = (/^(\d{1,2}):(\d{1,2})$/).exec(input);
    if (hm) {
        return validateClockTime(parseInt(hm[1], 10), parseInt(hm[2], 10));
    }

    if ((/^-?\d+[.,]\d+$/).test(input)) {
        const totalMinutes = Math.round(parseFloat(input.replace(',', '.')) * 60);
        return validateClockTime(Math.floor(totalMinutes / 60), totalMinutes % 60);
    }

    if ((/^\d{3,4}$/).test(input)) {
        const hours = input.length === 4 ?
            parseInt(input.slice(0, 2), 10) :
            parseInt(input.slice(0, 1), 10);
        const minutes = parseInt(input.slice(-2), 10);
        return validateClockTime(hours, minutes);
    }

    if ((/^-?\d{1,2}$/).test(input)) {
        return validateClockTime(parseInt(input, 10), 0);
    }

    return null;
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

/** After manual add: new start = previous end, new end = previous end + same duration. */
export function nextFormTimes(
    date: Date,
    startParts: {hours: number; minutes: number},
    endParts: {hours: number; minutes: number},
): {date: Date; start: string; end: string} {
    const start = new Date(date);
    start.setHours(startParts.hours, startParts.minutes, 0, 0);
    const end = new Date(date);
    end.setHours(endParts.hours, endParts.minutes, 0, 0);
    const durationMs = end.getTime() - start.getTime();
    const newStart = new Date(end);
    let newEnd = new Date(end.getTime() + durationMs);

    // ponytail: same-day form only; cap at 23:59 if duration would cross midnight
    if (newEnd.toDateString() !== newStart.toDateString()) {
        newEnd = new Date(newStart);
        newEnd.setHours(23, 59, 0, 0);
    }
    return {
        date: new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate()),
        start: formatTime(newStart),
        end: formatTime(newEnd),
    };
}
