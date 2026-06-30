import en from './en.json';
import ru from './ru.json';

export type PluginLocale = 'en' | 'ru';

const catalogs: Record<PluginLocale, Record<string, string>> = {en, ru};

export function resolveLocale(locale: string): PluginLocale {
    return locale.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function translate(locale: string, id: string, defaultMessage: string): string {
    const catalog = catalogs[resolveLocale(locale)];
    return catalog[id] ?? defaultMessage;
}

export function getUserLocaleFromState(state: {
    entities: {
        users: {
            currentUserId: string;
            profiles: Record<string, {locale?: string} | undefined>;
        };
    };
}): string {
    const userId = state.entities.users.currentUserId;
    return state.entities.users.profiles[userId]?.locale || 'en';
}
