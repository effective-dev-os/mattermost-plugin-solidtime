import manifest from 'manifest';
import {initialState, type PluginState} from 'reducer';

import type {GlobalState} from '@mattermost/types/store';

export function getPluginState(state: GlobalState): PluginState {
    const key = `plugins-${manifest.id}`;
    const slice = (state as unknown as Record<string, PluginState | undefined>)[key];
    return slice ?? initialState;
}
