export type EntryMode = 'manual' | 'timer';

export const ActionType = {
    SET_ACTIVE_TIMER: 'solidtime_set_active_timer',
    SET_ENTRY_MODE: 'solidtime_set_entry_mode',
    SET_SELECTED_ORG: 'solidtime_set_selected_org',
} as const;

export type PluginState = {
    activeTimer: import('types/solidtime').TimeEntry | null;
    entryMode: EntryMode;
    selectedOrgId: string | null;
};

export const initialState: PluginState = {
    activeTimer: null,
    entryMode: 'manual',
    selectedOrgId: null,
};

export type SetActiveTimerAction = {
    type: typeof ActionType.SET_ACTIVE_TIMER;
    active: import('types/solidtime').TimeEntry | null;
};

export type SetEntryModeAction = {
    type: typeof ActionType.SET_ENTRY_MODE;
    mode: EntryMode;
};

export type SetSelectedOrgAction = {
    type: typeof ActionType.SET_SELECTED_ORG;
    orgId: string | null;
};

export type PluginAction = SetActiveTimerAction | SetEntryModeAction | SetSelectedOrgAction;

export const setActiveTimer = (active: import('types/solidtime').TimeEntry | null): SetActiveTimerAction => ({
    type: ActionType.SET_ACTIVE_TIMER,
    active,
});

export const setEntryMode = (mode: EntryMode): SetEntryModeAction => ({
    type: ActionType.SET_ENTRY_MODE,
    mode,
});

export const setSelectedOrg = (orgId: string | null): SetSelectedOrgAction => ({
    type: ActionType.SET_SELECTED_ORG,
    orgId,
});

export function reducer(state: PluginState = initialState, action: PluginAction): PluginState {
    switch (action.type) {
    case ActionType.SET_ACTIVE_TIMER:
        return {...state, activeTimer: action.active};
    case ActionType.SET_ENTRY_MODE:
        return {...state, entryMode: action.mode};
    case ActionType.SET_SELECTED_ORG:
        return {...state, selectedOrgId: action.orgId};
    default:
        return state;
    }
}
