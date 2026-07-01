import type {GlobalState} from '@mattermost/types/store';

const RHS_STATE_PLUGIN = 'plugin';

type RhsViewState = {
    rhsState: string | null;
    pluggableId: string;
    isSidebarOpen: boolean;
};

type ViewsState = {
    rhs?: RhsViewState;
    rhsSuppressed?: boolean;
};

let rhsPluggableId: string | null = null;

export function setRhsPluggableId(id: string): void {
    rhsPluggableId = id;
}

export function isSolidtimeRhsOpen(state: GlobalState): boolean {
    if (!rhsPluggableId) {
        return false;
    }
    const views = (state as GlobalState & {views?: ViewsState}).views;
    const rhs = views?.rhs;
    if (!rhs || views?.rhsSuppressed) {
        return false;
    }
    return rhs.isSidebarOpen
        && rhs.rhsState === RHS_STATE_PLUGIN
        && rhs.pluggableId === rhsPluggableId;
}

// ponytail: Mattermost sidebar_right focuses the first tabbable in #rhsContainer via setTimeout(0) on open
export function focusRhsField(element: HTMLElement | null | undefined): () => void {
    if (!element) {
        return () => undefined;
    }
    const focus = () => {
        if (document.contains(element)) {
            element.focus({preventScroll: true});
        }
    };
    const timers = [0, 50, 150].map((ms) => window.setTimeout(focus, ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
}
