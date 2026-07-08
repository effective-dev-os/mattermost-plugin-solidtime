// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getConnectionStatus} from 'api/client';
import {setConnectionState} from 'connection_state';
import {getUserLocaleFromState, resolveLocale, translate} from 'i18n/helpers';
import manifest from 'manifest';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {reducer, setActiveTimer, setSelectedOrg} from 'reducer';
import type {Store, UnknownAction} from 'redux';
import {isSolidtimeRhsOpen, setRhsPluggableId} from 'utils/rhs';

import type {GlobalState} from '@mattermost/types/store';

import {logError, LogErrorBarMode} from 'mattermost-redux/actions/errors';

import {createChannelHeaderButton, refreshActiveTimer} from 'components/channel_header_timer';
import RHSSidebar from 'components/rhs/sidebar';

import type {PluginRegistry} from 'types/mattermost-webapp';
import type {TimeEntry} from 'types/solidtime';

const WS_CONNECTION = `custom_${manifest.id}_solidtime-connection-change`;
const WS_ORG = `custom_${manifest.id}_solidtime-org-change`;
const WS_TIMER = `custom_${manifest.id}_solidtime-timer-change`;

const RHSTitle = () => (
    <FormattedMessage
        id='solidtime.rhs.title'
        defaultMessage='Solidtime'
    />
);

export default class Plugin {
    private registry: PluginRegistry | null = null;
    private store: Store<GlobalState> | null = null;
    private channelHeaderButtonId: string | null = null;
    private rhsPluginId: string | null = null;
    private showRHSPlugin: UnknownAction | null = null;
    private hideRHSPlugin: UnknownAction | null = null;
    private connected = false;
    private localeUnsubscribe: (() => void) | null = null;
    private lastHeaderLocale: string | null = null;
    private updatingHeaderButton = false;

    private showError = (message: string) => {
        if (this.store) {
            this.store.dispatch(logError({message, server_error_id: ''}, {errorBarMode: LogErrorBarMode.Always}) as never);
        }
    };

    private onConnectionLost = () => {
        this.switchConnection(false).catch(() => undefined);
    };

    private isRhsOpen = (): boolean => {
        if (!this.store) {
            return false;
        }
        return isSolidtimeRhsOpen(this.store.getState());
    };

    private toggleRhs = () => {
        if (!this.store || !this.showRHSPlugin || !this.hideRHSPlugin) {
            return;
        }
        if (this.isRhsOpen()) {
            this.store.dispatch(this.hideRHSPlugin);
        } else {
            this.store.dispatch(this.showRHSPlugin);
        }
    };

    private unregisterHeaderButton = () => {
        if (!this.channelHeaderButtonId || !this.registry) {
            return;
        }
        const id = this.channelHeaderButtonId;

        // ponytail: clear before unregister — its Redux dispatch re-enters store.subscribe
        this.channelHeaderButtonId = null;
        this.registry.unregisterComponent(id);
    };

    private registerHeaderButton = () => {
        if (!this.registry || !this.store || !this.showRHSPlugin || this.updatingHeaderButton) {
            return;
        }
        const locale = getUserLocaleFromState(this.store.getState());
        if (this.channelHeaderButtonId && this.lastHeaderLocale === locale) {
            return;
        }

        this.updatingHeaderButton = true;
        this.lastHeaderLocale = locale;
        try {
            this.unregisterHeaderButton();
            const toggleRhs = this.toggleRhs;
            const HeaderButton = createChannelHeaderButton(
                () => toggleRhs(),
                this.showError,
                this.onConnectionLost,
            );
            this.channelHeaderButtonId = this.registry.registerChannelHeaderButtonAction(
                <HeaderButton/>,
                () => toggleRhs(),
                translate(locale, 'solidtime.rhs.title', 'Solidtime'),
                translate(locale, 'solidtime.header.tooltip', 'Solidtime Time Tracker'),
            ) || null;
        } finally {
            this.updatingHeaderButton = false;
        }
    };

    private syncChrome = async () => {
        if (!this.store) {
            return;
        }

        try {
            const {server_url: serverURL, connected} = await getConnectionStatus();
            const configured = Boolean(serverURL);

            if (configured) {
                this.registerHeaderButton();
            } else {
                this.unregisterHeaderButton();
                this.lastHeaderLocale = null;
                if (this.hideRHSPlugin) {
                    this.store.dispatch(this.hideRHSPlugin);
                }
            }

            if (configured) {
                await this.switchConnection(connected);
            } else {
                await this.switchConnection(false);
            }
        } catch {
            this.unregisterHeaderButton();
            await this.switchConnection(false);
        }
    };

    private switchConnection = async (connected: boolean) => {
        this.connected = connected;
        setConnectionState(connected);
        if (!this.store) {
            return;
        }

        if (connected) {
            await refreshActiveTimer(
                (action) => this.store!.dispatch(action as never),
                this.onConnectionLost,
            );
        } else {
            this.store.dispatch(setActiveTimer(null) as never);
            this.store.dispatch(setSelectedOrg(null) as never);
        }
    };

    public async initialize(registry: PluginRegistry, store: Store<GlobalState>) {
        this.registry = registry;
        this.store = store;

        registry.registerTranslations((locale: string) => {
            const resolved = resolveLocale(locale);
            // eslint-disable-next-line global-require
            return require(`./i18n/${resolved}.json`);
        });

        registry.registerReducer(reducer as import('redux').Reducer);

        const rhs = registry.registerRightHandSidebarComponent(
            () => (
                <RHSSidebar
                    onError={this.showError}
                    onConnectionLost={this.onConnectionLost}
                    onConnected={() => this.switchConnection(true).catch(() => undefined)}
                />
            ),
            RHSTitle,
        );
        this.rhsPluginId = rhs.id;
        setRhsPluggableId(rhs.id);
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
            await this.syncChrome();
        });

        this.localeUnsubscribe = store.subscribe(() => {
            if (this.updatingHeaderButton || !this.channelHeaderButtonId) {
                return;
            }
            const locale = getUserLocaleFromState(store.getState());
            if (locale === this.lastHeaderLocale) {
                return;
            }
            this.registerHeaderButton();
        });

        await this.syncChrome();
    }

    public async uninitialize() {
        this.localeUnsubscribe?.();
        this.localeUnsubscribe = null;
        this.registry?.unregisterWebSocketEventHandler(WS_CONNECTION);
        this.registry?.unregisterWebSocketEventHandler(WS_ORG);
        this.registry?.unregisterWebSocketEventHandler(WS_TIMER);
        this.registry?.unregisterReconnectHandler();
        this.unregisterHeaderButton();
        this.lastHeaderLocale = null;
        setConnectionState(false);
    }
}

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: Plugin): void;
    }
}

window.registerPlugin(manifest.id, new Plugin());
