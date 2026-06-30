// ponytail: Solidtime has no favorites API; persist per-user in localStorage
const storageKey = (userId: string) => `solidtime_favorites_${userId}`;

export function loadFavoriteProjectIds(userId: string): string[] {
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
        return [];
    }
}

export function saveFavoriteProjectIds(userId: string, ids: string[]): void {
    localStorage.setItem(storageKey(userId), JSON.stringify(ids));
}

export function toggleFavoriteProjectId(userId: string, projectId: string): string[] {
    const current = loadFavoriteProjectIds(userId);
    const next = current.includes(projectId) ?
        current.filter((id) => id !== projectId) :
        [...current, projectId];
    saveFavoriteProjectIds(userId, next);
    return next;
}
