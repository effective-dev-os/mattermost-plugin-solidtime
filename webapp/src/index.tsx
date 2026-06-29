// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getConnectionStatus} from 'api/client';
import {setConnectionState} from 'connection_state';
import manifest from 'manifest';
import React from 'react';
import type {Store, UnknownAction} from 'redux';

import type {GlobalState} from '@mattermost/types/store';

import {logError, LogErrorBarMode} from 'mattermost-redux/actions/errors';

import SolidtimeIcon from 'components/channel_header_button';
import RHSSidebar from 'components/rhs/sidebar';

import type {PluginRegistry} from 'types/mattermost-webapp';

const WS_EVENT = `custom_${manifest.id}_solidtime-connection-change`;

export default class Plugin {
    private registry: PluginRegistry | null = null;
    private store: Store<GlobalState> | null = null;
    private channelHeaderButtonId: string | null = null;
    private showRHSPlugin: UnknownAction | null = null;
    private hideRHSPlugin: UnknownAction | null = null;
    private connected = false;

    private showError = (message: string) => {
        if (this.store) {
            this.store.dispatch(logError({message, server_error_id: ''}, {errorBarMode: LogErrorBarMode.Always}) as never);
        }
    };

    private switchConnection = (connected: boolean) => {
        this.connected = connected;
        setConnectionState(connected);
        if (!this.registry || !this.store) {
            return;
        }

        if (connected) {
            if (!this.channelHeaderButtonId && this.showRHSPlugin) {
                const show = this.showRHSPlugin;
                this.channelHeaderButtonId = this.registry.registerChannelHeaderButtonAction(
                    <SolidtimeIcon/>,
                    () => this.store!.dispatch(show),
                    'Solidtime',
                    'Open Solidtime Time Tracker',
                ) || null;
            }
        } else {
            if (this.channelHeaderButtonId) {
                this.registry.unregisterComponent(this.channelHeaderButtonId);
                this.channelHeaderButtonId = null;
            }
            if (this.hideRHSPlugin) {
                this.store.dispatch(this.hideRHSPlugin);
            }
        }
    };

    public async initialize(registry: PluginRegistry, store: Store<GlobalState>) {
        this.registry = registry;
        this.store = store;

        const rhs = registry.registerRightHandSidebarComponent(
            () => (
                <RHSSidebar
                    onError={this.showError}
                />
            ),
            'Solidtime',
        );
        this.showRHSPlugin = rhs.showRHSPlugin;
        this.hideRHSPlugin = rhs.hideRHSPlugin;

        registry.registerWebSocketEventHandler<{connected: boolean}>(WS_EVENT, ({data}) => {
            this.switchConnection(Boolean(data.connected));
        });

        try {
            const {connected} = await getConnectionStatus();
            this.switchConnection(connected);
        } catch {
            this.switchConnection(false);
        }
    }

    public async uninitialize() {
        this.registry?.unregisterWebSocketEventHandler(WS_EVENT);
        this.switchConnection(false);
    }
}

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: Plugin): void;
    }
}

window.registerPlugin(manifest.id, new Plugin());
