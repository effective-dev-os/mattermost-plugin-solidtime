import type {EntryMode} from 'reducer';

const storageKey = (userId: string) => `solidtime_entry_mode_${userId}`;

export function loadEntryMode(userId: string): EntryMode {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        return raw === 'timer' ? 'timer' : 'manual';
    } catch {
        return 'manual';
    }
}

export function saveEntryMode(userId: string, mode: EntryMode): void {
    localStorage.setItem(storageKey(userId), mode);
}
