// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getConnectionStatus} from 'api/client';
import {setConnectionState} from 'connection_state';
import manifest from 'manifest';
import React from 'react';
import {reducer, setActiveTimer, setSelectedOrg} from 'reducer';
import type {Store, UnknownAction} from 'redux';

import type {GlobalState} from '@mattermost/types/store';

import {logError, LogErrorBarMode} from 'mattermost-redux/actions/errors';

import {createChannelHeaderButton, refreshActiveTimer} from 'components/channel_header_timer';
import RHSSidebar from 'components/rhs/sidebar';

import type {PluginRegistry} from 'types/mattermost-webapp';
import type {TimeEntry} from 'types/solidtime';

const WS_CONNECTION = `custom_${manifest.id}_solidtime-connection-change`;
const WS_ORG = `custom_${manifest.id}_solidtime-org-change`;
const WS_TIMER = `custom_${manifest.id}_solidtime-timer-change`;

export default class Plugin {
    private registry: PluginRegistry | null = null;
    private store: Store<GlobalState> | null = null;
    private channelHeaderButtonId: string | null = null;
    private showRHSPlugin: UnknownAction | null = null;
    private hideRHSPlugin: UnknownAction | null = null;
    private rhsOpen = false;
    private connected = false;

    private showError = (message: string) => {
        if (this.store) {
            this.store.dispatch(logError({message, server_error_id: ''}, {errorBarMode: LogErrorBarMode.Always}) as never);
        }
    };

    private onConnectionLost = () => {
        void this.switchConnection(false);
    };

    private setRhsOpen = (open: boolean) => {
        this.rhsOpen = open;
    };

    private toggleRhs = () => {
        if (!this.store || !this.showRHSPlugin || !this.hideRHSPlugin) {
            return;
        }
        if (this.rhsOpen) {
            this.store.dispatch(this.hideRHSPlugin);
        } else {
            this.store.dispatch(this.showRHSPlugin);
        }
    };

    private registerHeaderButton = () => {
        if (!this.registry || !this.store || !this.showRHSPlugin || this.channelHeaderButtonId) {
            return;
        }
        const toggleRhs = this.toggleRhs;
        const store = this.store;
        const HeaderButton = createChannelHeaderButton(
            () => toggleRhs(),
            this.showError,
            this.onConnectionLost,
        );
        this.channelHeaderButtonId = this.registry.registerChannelHeaderButtonAction(
            <HeaderButton/>,
            () => toggleRhs(),
            'Solidtime',
            'Toggle Solidtime Time Tracker',
        ) || null;
    };

    private switchConnection = async (connected: boolean) => {
        this.connected = connected;
        setConnectionState(connected);
        if (!this.registry || !this.store) {
            return;
        }

        if (connected) {
            this.registerHeaderButton();
            await refreshActiveTimer(
                (action) => this.store!.dispatch(action as never),
                this.onConnectionLost,
            );
        } else {
            if (this.channelHeaderButtonId) {
                this.registry.unregisterComponent(this.channelHeaderButtonId);
                this.channelHeaderButtonId = null;
            }
            if (this.hideRHSPlugin) {
                this.store.dispatch(this.hideRHSPlugin);
            }
            this.rhsOpen = false;
            this.store.dispatch(setActiveTimer(null) as never);
            this.store.dispatch(setSelectedOrg(null) as never);
        }
    };

    public async initialize(registry: PluginRegistry, store: Store<GlobalState>) {
        this.registry = registry;
        this.store = store;

        registry.registerReducer(reducer as import('redux').Reducer);

        const rhs = registry.registerRightHandSidebarComponent(
            () => (
                <RHSSidebar
                    onError={this.showError}
                    onConnectionLost={this.onConnectionLost}
                    onRhsOpenChange={this.setRhsOpen}
                />
            ),
            'Solidtime',
        );
        this.showRHSPlugin = rhs.showRHSPlugin;
        this.hideRHSPlugin = rhs.hideRHSPlugin;

        registry.registerWebSocketEventHandler<{connected: boolean}>(WS_CONNECTION, ({data}) => {
            this.switchConnection(Boolean(data.connected));
        });

        registry.registerWebSocketEventHandler<{organization_id: string}>(WS_ORG, ({data}) => {
            if (this.store && data.organization_id) {
                this.store.dispatch(setSelectedOrg(data.organization_id) as never);
            }
        });

        registry.registerWebSocketEventHandler<{active: TimeEntry | null}>(WS_TIMER, ({data}) => {
            if (this.store && this.connected) {
                this.store.dispatch(setActiveTimer(data.active ?? null) as never);
            }
        });

        registry.registerReconnectHandler(async () => {
            if (!this.store) {
                return;
            }
            try {
                const {connected} = await getConnectionStatus();
                await this.switchConnection(connected);
            } catch {
                await this.switchConnection(false);
            }
        });

        try {
            const {connected} = await getConnectionStatus();
            await this.switchConnection(connected);
        } catch {
            await this.switchConnection(false);
        }
    }

    public async uninitialize() {
        this.registry?.unregisterWebSocketEventHandler(WS_CONNECTION);
        this.registry?.unregisterWebSocketEventHandler(WS_ORG);
        this.registry?.unregisterWebSocketEventHandler(WS_TIMER);
        this.registry?.unregisterReconnectHandler();
        await this.switchConnection(false);
    }
}

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: Plugin): void;
    }
}

window.registerPlugin(manifest.id, new Plugin());
