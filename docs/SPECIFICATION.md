# Functional Requirements Specification

This document describes the full scope of functionality for the Mattermost plugin integrating with Solidtime TimeTracker.

## 1. Plugin Settings (System Console)

The Mattermost administrator configures the plugin in **System Console → Plugins → Solidtime**.

### 1.1. Parameters

| Key | Type | Required | Description |
|------|-----|--------------|----------|
| `SolidtimeServerURL` | `string` | Yes | Base URL of the Solidtime server (e.g., `https://app.solidtime.io` or a self-hosted instance URL). Used by the plugin server to proxy requests to the Solidtime API. |

### 1.2. Behavior

- The setting is stored in the Mattermost plugin configuration (`plugin.json` → `settings_schema`).
- **Without `SolidtimeServerURL`, the plugin does not activate** — `OnActivate` returns an error; the administrator must specify the URL before enabling the plugin.
- The URL must not contain a trailing slash; normalization is performed on the server.

---

## 2. Slash Command `/solidtime`

The command is registered by the plugin server and is available to all Mattermost users.

### 2.1. `/solidtime connect {api_token}`

**Purpose:** link a Mattermost account to a Solidtime account.

**Algorithm:**

1. The user enters `/solidtime connect <api_token>`.
2. The plugin server:
   - Verifies that `SolidtimeServerURL` is configured.
   - Performs a test request to the Solidtime API with the provided token (e.g., `GET /api/v1/users/me`).
   - On success — saves the token in the KV Store, linked to the Mattermost `user_id`.
   - On error — returns an ephemeral message describing the problem (invalid token, unreachable server, etc.).
3. The webapp receives a connection signal (via API or WebSocket) and opens the full RHS functionality.

**Alternative:** connection via RHS (`connect_panel.tsx`) — `POST /api/v1/connection/connect` with the same algorithm.

**Security:**

- The token is stored only on the server (KV Store), never sent to the client.
- The token is a JWT, created in Solidtime profile settings ([documentation](https://docs.solidtime.io/user-guide/access-api)).

### 2.2. `/solidtime disconnect`

**Purpose:** unlink the account.

**Algorithm:**

1. The user enters `/solidtime disconnect`.
2. The server removes the saved token from the KV Store for the current `user_id`.
3. The webapp resets timer/org state; the RHS shows the connection screen. The Channel Header button **remains visible**.

### 2.3. Connection State

| State | Channel Header Button | RHS |
|-----------|----------------------|-----|
| Not connected | Visible (Solidtime logo) | Connection screen with instructions and API Token field |
| Connected | Visible (logo or timer widget) | Form + entry list |

---

## 3. Channel Header Button Action

Registered in the webapp via `registerChannelHeaderButtonAction`.

### 3.1. Registration Parameters

| Parameter | Value |
|----------|----------|
| `icon` | Solidtime logo (SVG/PNG from `assets/`) or timer widget (see §3.3) |
| `dropdownText` | «Solidtime» |
| `tooltipText` | «Open Solidtime Time Tracker» |
| `action` | Open/close RHS via `toggleRHSPlugin` |

### 3.2. Visibility

- The button is registered only if the plugin is active **and** `SolidtimeServerURL` is configured (webapp checks `server_url` from `GET /connection/status`).
- Without a URL, the plugin does not enable; the button is not displayed.
- On `disconnect`, the button is not hidden; only the timer widget is reset (if it was active).

### 3.3. Running Timer Widget

When the user has an **active** time entry (`end: null`), the Channel Header shows a composite widget instead of a static icon:

| Element | Behavior |
|---------|-----------|
| STOP icon (■) | Stops the timer (`PUT /time-entries/{id}` with `end: now`) |
| Ticking time | `HH:MM` from the active entry's `start` |
| Click on time | Opens RHS |

Synchronization: on webapp mount, WebSocket `solidtime-timer-change`, poll `GET /time-entries/active` on reconnect.

---

## 4. Right-Hand Sidebar (RHS)

Registered via `registerRightHandSidebarComponent`. Opens on Channel Header Button click.

### 4.0. Connection Screen (Not Connected)

If the user is not connected, the RHS shows `connect_panel.tsx` instead of the form and list:

1. Instructions: open `{SolidtimeServerURL}/user/profile` (link with `target="_blank"`).
2. Create a token in the **Create API Token** section.
3. API Token input field (type `password`) and **Connect** button → `POST /api/v1/connection/connect`.
4. If `SolidtimeServerURL` is not configured — message to contact the administrator.

The `/solidtime connect` slash command remains an alternative way to connect.

### 4.1. Panel Structure (Connected)

```
┌─────────────────────────────────────┐
│  [Organization selector]            │  ← if multiple orgs
├─────────────────────────────────────┤
│  [Add entry form]                   │  ← top, fixed
├─────────────────────────────────────┤
│                                     │
│  [Entry list by days/weeks]         │  ← scrollable area
│                                     │
├─────────────────────────────────────┤
│  [Pagination]                       │  ← footer, pinned to bottom
└─────────────────────────────────────┘
```

### 4.1.1. Organization Selector

- Displayed above the form if the user has multiple Solidtime organizations.
- On org change: `PUT /api/v1/organizations/current`, reset projects/entries, reload data.
- WebSocket `solidtime-org-change` synchronizes org changes across tabs.

### 4.2. Add Entry Form (Top Section)

#### Row 1

| Element | Type | Required | Description |
|---------|-----|--------------|----------|
| Task description | `text input` | No | Placeholder: «What have you worked on?» |
| Project and task | `dropdown` | **Yes** | Search by projects/clients, grouped by clients, select existing task |

#### Row 2

| Element | Type | Description |
|---------|-----|----------|
| Billable | `toggle` | Billable / non-billable switch (icon `$`) |
| Time and date | `time range` + `date picker` | `HH:mm - HH:mm` and calendar button `📅` in one group; default — today |
| ADD / START / STOP button | `button` | Manual Mode: **ADD**; Timer Mode: **START** / **STOP** |
| Additional options | `menu (⋮)` | **Manual Mode** / **Timer Mode** switch |

Detailed layout — in [UI.md](UI.md).

#### Manual Mode / Timer Mode

- **Manual Mode** (default): editable time and date; **ADD** button creates an entry with `start` and `end`.
- **Timer Mode**: time and date are read-only, elapsed `HH:MM` is displayed; **START** — `POST` with `end: null` (only if no active timer); **STOP** — `PUT` with `end: now`.
- The selected mode is saved in `localStorage` per-user and restored when opening RHS (with an active timer — always Timer).
- Mode switching — `⋮` menu in the form.

### 4.3. Entry List (Middle Section)

- Entries are grouped by day («Today», «Yesterday», specific dates).
- Above the list — **Week total** (total time for the current week).
- Each entry is an **inline-editable entity** with the same fields as the add form:
  - Task description
  - Project — client (with project color indicator)
  - Billable / non-billable
  - Time (from — to) and date (calendar button on the same row)
  - Duration (calculated from time, displayed on the right)
- On field blur or value change — `PUT /api/v1/time-entries/{id}` to the plugin; the plugin updates the entry in Solidtime.
- Delete button (× → OK) — `DELETE /api/v1/time-entries/{id}`; list and week total are updated.
- Loading entries for the week: server iterates all Solidtime pages (ceiling ~500 entries).

Detailed layout and field behavior — in [UI.md](UI.md#entry-card-inline-editing).

### 4.4. Footer with Pagination

- Pinned to the bottom of RHS (does not scroll with the list).
- Previous / next page buttons or week navigation.
- Display of the current date range.

---

## 5. Plugin Server API Endpoints

All endpoints require Mattermost authorization (`Mattermost-User-ID` header). The Solidtime token is injected by the server from the KV Store.

| Method | Path | Description |
|-------|------|----------|
| `GET` | `/api/v1/connection/status` | Connection status and `server_url` (from plugin settings) |
| `POST` | `/api/v1/connection/connect` | Connect (slash command or RHS) |
| `DELETE` | `/api/v1/connection/disconnect` | Disconnect |
| `GET` | `/api/v1/organizations` | User's organization list (from KV cache) |
| `PUT` | `/api/v1/organizations/current` | Change current organization |
| `GET` | `/api/v1/projects` | Project list (with clients) |
| `GET` | `/api/v1/tasks` | Task list by project |
| `GET` | `/api/v1/time-entries` | Entry list for a period (server-side multi-page, ceiling ~500) |
| `GET` | `/api/v1/time-entries/active` | Active (running) entry |
| `POST` | `/api/v1/time-entries` | Create entry (including `end: null` for timer) |
| `PUT` | `/api/v1/time-entries/{id}` | Update entry (inline editing, stop timer) |
| `DELETE` | `/api/v1/time-entries/{id}` | Delete entry |
| `GET` | `/api/v1/time-entries/aggregate` | Aggregation (week total) |

Full contract — in [SOLIDTIME_API.md](SOLIDTIME_API.md).

---

## 6. Data Storage

| Data | Where stored | Key |
|--------|--------------|------|
| Solidtime server URL | Plugin configuration | `SolidtimeServerURL` |
| User API token | KV Store (per user) | `solidtime_token_{userID}` |
| Organization ID (selected) | KV Store (per user) | `solidtime_org_{userID}` |
| Member ID (selected org) | KV Store (per user) | `solidtime_member_{userID}` |
| Membership list | KV Store (per user) | `solidtime_memberships_{userID}` — JSON `[{org_id, member_id, org_name}]` |
| Favorite projects | Browser localStorage (per user) | `solidtime_favorites_{userID}` |

---

## 7. Acceptance Criteria

- [x] Administrator can specify Solidtime URL in plugin settings
- [x] Without URL, plugin does not activate (`OnActivate` → error)
- [x] Channel Header button is visible only when URL is configured (and plugin is active)
- [x] `/solidtime connect <token>` validates token and saves it
- [x] Solidtime button in channel header is always visible (including when not connected)
- [x] `/solidtime disconnect` removes token; RHS shows connection screen
- [x] Unconnected user can connect from RHS (instructions + API Token field)
- [x] Button click opens RHS with form and entry list
- [x] Form allows creating a time entry with all fields (without tags)
- [x] Entry list is grouped by day, shows week total
- [x] Each entry in the list can be edited inline; changes are saved to Solidtime on blur or value change
- [x] Pagination is pinned to RHS footer
- [x] Tokens do not leak to the client
- [x] User with multiple orgs can select organization in RHS; projects/entries match selected org
- [x] Entry can be deleted from list; week total is updated
- [x] Project can be marked as favorite (☆); favorites appear at top of dropdown and persist after reload
- [x] Week with >100 entries loads all entries for the period (with ceiling ~500)
- [x] Timer Mode: START/STOP in form; Channel Header shows ticking time with active timer
- [x] Manual/Timer mode persists between sessions (localStorage per-user)
- [x] WebSocket `solidtime-org-change` and `solidtime-timer-change` synchronize UI across tabs

---

## 8. Future Functionality (Outside Current Scope)

- Creating projects and tasks from RHS (requires permission checks in Solidtime)
- Notifications about unclosed timers
