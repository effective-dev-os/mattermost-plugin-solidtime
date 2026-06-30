# Mattermost Reference Plugins

When implementing Solidtime Plugin functionality, **first** look at the code of our existing plugins — they reflect team conventions, patterns, and proven solutions. Also study open-source plugins on [GitHub (mattermost)](https://github.com/mattermost) and in the [Mattermost Marketplace](https://mattermost.com/marketplace/).

## Internal references (Effective)

### 1. mattermost-plugin-yandex-calendar

**Path:** `/Users/danil/Documents/Work/Effective/Mattermost/mattermost-plugin-yandex-calendar`

**When to look:** OAuth/connect/disconnect, slash commands, KV Store, background jobs, i18n, layered server architecture.

| Pattern | Where to look |
|---------|---------------|
| `/command connect` and `/disconnect` | `calendar/command/command.go`, `calendar/command/connect.go`, `calendar/command/disconnect.go` |
| Slash command autocomplete | `calendar/command/command.go` → `GetAutocompleteData` |
| Per-user credential storage | `calendar/store/` (encrypted KV, TTL, cache) |
| HTTP API + middleware | `calendar/api/api.go` |
| Background tasks (cluster jobs) | `calendar/jobs/`, `calendar/engine/poll_notifications.go` |
| Engine layer (business logic) | `calendar/engine/` |
| i18n (ru/en) | `assets/i18n/`, `.cursor/rules/i18n-localization-always.mdc` |
| System Console settings | `plugin.json` → `settings_schema` |
| Cursor rules (architecture) | `.cursor/rules/project-architecture-patterns.mdc` |

**Relevance for Solidtime:** closest analog for `connect` / `disconnect` flow and per-user token storage.

---

### 2. com.effective.food-ordering

**Path:** `/Users/danil/Documents/Work/Effective/Mattermost/com.effective.food-ordering`

**When to look:** conditional Channel Header Button visibility, WebSocket events, webapp API client, custom routes.

| Pattern | Where to look |
|---------|---------------|
| Channel Header Button (show/hide) | `webapp/src/index.ts` → `switchStatus()` |
| `unregisterComponent` when hiding the button | `webapp/src/index.ts` |
| WebSocket → UI update | `registerWebSocketEventHandler` + `switchStatus` |
| Status check on initialization | `getRequest('/food-ordering-status')` |
| Plugin API client (fetch + CSRF) | `webapp/src/client.ts` |
| Custom route (standalone page) | `registerCustomRoute('/food-list', FoodList)` |
| Plugin Redux reducer | `webapp/src/reducer.ts`, `registerReducer` |
| Custom post type | `registerPostTypeComponent` |
| Server API + KV | `server/api.go`, `server/kvstore.go` |
| Cron jobs | `server/cron.go` |

**Relevance for Solidtime:** **key reference** for the "channel header button visible only after connect" pattern via `register` / `unregisterComponent` + WebSocket/API.

---

### 3. mattermost-plugin-scheduled-messages

**Path:** `/Users/danil/Documents/Work/Effective/Mattermost/mattermost-plugin-scheduled-messages`

**When to look:** Mattermost UI injection, WebSocket events, root component hooks.

| Pattern | Where to look |
|---------|---------------|
| Root component (global hook) | `webapp/src/index.ts` → `registerRootComponent(Hook)` |
| WebSocket custom events | `webapp/src/websocket-events.ts` |
| DOM injection | `webapp/src/injection.ts` |
| Post editor integration | `webapp/src/components/Hook/` (`registerPostEditorActionComponent` commented out) |

**Relevance for Solidtime:** WebSocket notifications to webapp after server-side actions (e.g., after `/solidtime connect`).

---

### 4. mattermost-plugin-agents (Effective AI)

**Path:** `/Users/danil/Documents/Work/Effective/Mattermost/mattermost-plugin-agents`

**When to look:** RHS sidebar, Channel Header Button + RHS toggle, Redux, API client, i18n.

| Pattern | Where to look |
|---------|---------------|
| `registerRightHandSidebarComponent` | `webapp/src/index.tsx` |
| Channel Header → `toggleRHSPlugin` | `registerChannelHeaderButtonAction` + `rhs.toggleRHSPlugin` |
| Conditional icon render in header | `ChannelHeaderIcon` (access check) |
| Redux setup | `webapp/src/redux.ts`, `setupRedux` |
| API client with SiteURL | `webapp/src/client.ts` → `setSiteURL` |
| Custom admin setting | `registerAdminConsoleCustomSetting` |
| Slash command hooks (webapp) | `registerSlashCommandWillBePostedHook` |
| WebSocket handlers | `registerWebSocketEventHandler` |
| i18n | `registerTranslations` |

**Relevance for Solidtime:** **key reference** for Channel Header Button + RHS sidebar integration.

---

## Matrix: Solidtime feature → reference

| Solidtime feature | Primary reference | Additional |
|-------------------|-------------------|------------|
| `/solidtime connect/disconnect` | yandex-calendar | — |
| Channel Header Button (conditional visibility) | food-ordering | agents |
| RHS sidebar | agents | — |
| API proxy (server → Solidtime) | yandex-calendar (`remote/`) | food-ordering (`server/api.go`) |
| KV Store (per-user tokens) | yandex-calendar (`store/`) | food-ordering (`kvstore.go`) |
| Webapp API client | food-ordering (`client.ts`) | agents (`client.ts`) |
| WebSocket → UI update | food-ordering | scheduled-messages |
| System Console settings | yandex-calendar (`plugin.json`) | agents (custom setting) |
| Pagination / lists in UI | — | agents (RHS components) |

## External references (GitHub)

Useful official and community plugins:

| Plugin | What to study |
|--------|---------------|
| [mattermost-plugin-starter-template](https://github.com/mattermost/mattermost-plugin-starter-template) | Base structure, Makefile, CI |
| [mattermost-plugin-demo](https://github.com/mattermost/mattermost-plugin-demo) | All registry methods, UI examples |
| [mattermost-plugin-github](https://github.com/mattermost/mattermost-plugin-github) | Channel header, sidebar, OAuth |
| [mattermost-plugin-jira](https://github.com/mattermost/mattermost-plugin-jira) | Slash commands, post actions |
| [mattermost-plugin-zoom](https://github.com/mattermost/mattermost-plugin-zoom) | Channel header button |

## How to use references

1. Identify the feature in [SPECIFICATION.md](SPECIFICATION.md).
2. Find the row in the matrix above.
3. Open the indicated file in the reference plugin.
4. Adapt the pattern for Solidtime (do not copy blindly — account for API differences).
5. When a new stable pattern emerges — update this document.
