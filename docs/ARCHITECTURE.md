# Architecture

## Overview

The plugin consists of two standard Mattermost parts:

```
┌──────────────────────────────────────────────────────────────┐
│                     Mattermost Server                        │
│  ┌─────────────────────┐    ┌──────────────────────────┐  │
│  │   Server (Go)       │    │   Webapp (React/TS)       │  │
│  │   server/           │    │   webapp/                 │  │
│  │                     │    │                           │  │
│  │  • Slash commands   │    │  • Channel Header (timer) │  │
│  │  • HTTP API proxy   │◄──►│  • RHS Sidebar            │  │
│  │  • KV Store         │    │  • Redux (timer, org)     │  │
│  │  • WebSocket events │    │                           │  │
│  └─────────┬───────────┘    └──────────────────────────┘  │
│            │                                                 │
└────────────┼─────────────────────────────────────────────────┘
             │ HTTPS (Bearer token from KV Store)
             ▼
┌────────────────────────┐
│   Solidtime Server     │
│   REST API v1          │
└────────────────────────┘
```

The webapp **never** calls Solidtime directly. All requests go through the plugin server, which injects the user's token.

## Directory structure

```
mattermost-plugin-solidtime/
├── plugin.json
├── server/
│   ├── main.go
│   ├── plugin.go
│   ├── configuration.go
│   ├── api.go               # HTTP router, proxy handlers
│   ├── command/
│   │   └── command.go
│   ├── connection/
│   │   └── service.go       # connect/disconnect, org switch, WS publish
│   ├── solidtime/
│   │   ├── client.go
│   │   └── types.go
│   └── store/
│       └── kvstore/
├── webapp/src/
│   ├── index.tsx
│   ├── reducer.ts           # activeTimer, entryMode, selectedOrgId
│   ├── selectors.ts
│   ├── connection_state.ts  # connect/disconnect UI state
│   ├── components/
│   │   ├── channel_header_timer.tsx
│   │   └── rhs/
│   │       ├── sidebar.tsx
│   │       ├── org_selector.tsx
│   │       ├── time_entry_form.tsx
│   │       ├── project_selector.tsx
│   │       ├── time_entry_list.tsx
│   │       └── ...
│   ├── api/client.ts
│   └── utils/
│       ├── time.ts
│       └── favorites.ts     # localStorage favorite projects
└── docs/
```

## Server (Go)

### Packages

| Package | Responsibility |
|---------|----------------|
| `main` | Plugin hooks, configuration, routing |
| `command` | Slash commands `/solidtime connect`, `/solidtime disconnect` |
| `connection` | Connect/disconnect, org list/switch, WS events |
| `solidtime` | Solidtime REST API HTTP client |
| `store/kvstore` | Tokens, selected org/member, memberships cache |

### KV Store (per user)

| Key | Contents |
|-----|----------|
| `solidtime_token_{userID}` | API token |
| `solidtime_org_{userID}` | Selected organization ID |
| `solidtime_member_{userID}` | Member ID for selected org |
| `solidtime_memberships_{userID}` | JSON array `{org_id, member_id, org_name}` |

On connect: memberships are cached from `GET /users/me/memberships`; selected org = previous if still in the list, otherwise the first.

### WebSocket events

Published via `connection.Service` → `PublishWebSocketEvent`:

| Event | Trigger |
|-------|---------|
| `solidtime-connection-change` | connect / disconnect |
| `solidtime-org-change` | `PUT /organizations/current` |
| `solidtime-timer-change` | create with `end:null`, stop, delete active entry |

Timer payload: `active` as `map[string]any` (JSON round-trip), not struct — otherwise plugin gob-RPC fails.

Webapp subscribes to `custom_{pluginId}_{event}`.

### API authorization

Middleware `MattermostAuthorizationRequired` checks the `Mattermost-User-ID` header. For each request the server:

1. Reads `userID` from the header.
2. Loads the Solidtime token from KV Store.
3. If missing — returns `401`.
4. Resolves `org_id` / `member_id` from KV (no silent fallback to the first org).
5. Calls Solidtime with `Authorization: Bearer <token>`.

### Time entry pagination

`GetTimeEntries` handler calls `GetAllTimeEntries` — up to 5 pages of 100 entries (cap 500) for the `start`/`end` range.

## Client (React/TypeScript)

### Registration

```typescript
registry.registerReducer(reducer);
registry.registerRightHandSidebarComponent(RHSSidebar, 'Solidtime');
registry.registerChannelHeaderButtonAction(
    <HeaderButton />,  // channel_header_timer — icon or widget; always visible
    () => store.dispatch(toggleRHSPlugin),
    'Solidtime',
    'Toggle Solidtime Time Tracker',
);
```

The button is registered on webapp init when `GET /connection/status` returns a non-empty `server_url`. Without URL the plugin does not activate on the server. RHS for disconnected users — `connect_panel.tsx`.

### State management

| State | Where |
|-------|-------|
| connect/disconnect | `connection_state.ts` (cached flag + WS subscribers) |
| `activeTimer`, `entryMode`, `selectedOrgId` | Redux (`reducer.ts`) |
| RHS data (projects, entries) | local state in `sidebar.tsx` |
| favorite project IDs | `localStorage` (`utils/favorites.ts`) |

### Data flows

**Org switch:**
```
OrgSelector → PUT /organizations/current
    → KV update → WS solidtime-org-change
    → sidebar reload projects + entries
```

**Running timer:**
```
Timer Mode START → POST /time-entries (end: null)
    → WS solidtime-timer-change → Redux setActiveTimer
    → Channel Header widget ticks (formatElapsed)

STOP → PUT /time-entries/{id} (end: now)
    → WS → activeTimer = null
```

**Entry deletion:**
```
time_entry_card ×→OK → DELETE /time-entries/{id}
    → list refresh; if was active → timer WS
```

## Configuration (`plugin.json`)

```json
{
  "settings_schema": {
    "settings": [
      {
        "key": "SolidtimeServerURL",
        "display_name": "Solidtime Server URL",
        "type": "text",
        "help_text": "Base URL of your Solidtime instance (e.g. https://app.solidtime.io)",
        "placeholder": "https://app.solidtime.io"
      }
    ]
  }
}
```

## Implementation references

Before writing code, study similar patterns in our plugins — see [REFERENCE_PLUGINS.md](REFERENCE_PLUGINS.md). Official Mattermost docs — in [mattermost/](mattermost/README.md).

## Dependencies

| Component | Technology | Version |
|-----------|------------|---------|
| Server | Go | 1.25+ |
| Webapp | React, TypeScript | Node 16+ (see `.nvmrc`) |
| Mattermost | plugin API | min_server_version 6.2.1 |
| HTTP router | gorilla/mux | — |

## Security

- Solidtime API tokens are stored in Mattermost KV Store, accessible only to the plugin server.
- All plugin API endpoints require Mattermost authorization.
- The token is passed in the slash command once and is not logged.
- HTTPS is required for production Solidtime instances.
