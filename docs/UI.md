# User Interface Specification

Description of the right-hand sidebar (RHS) UI based on the reference Solidtime/Clockify-like time tracker design.

## General Principles

- Compact layout optimized for Mattermost's narrow RHS (~400px).
- Light theme by default; dark Mattermost theme support via CSS variables.
- Blue accent (`#1C58D9` or system `--button-bg`) for primary actions.
- Font — Mattermost system font (Open Sans / Metropolis).
- **i18n:** all user-facing strings use `react-intl` message IDs (`solidtime.*`). Catalogs: `webapp/src/i18n/en.json`, `webapp/src/i18n/ru.json`. Russian profile language → Russian UI; otherwise English.

## RHS Layout

```
┌─────────────────────────────────────────┐
│ Solidtime                          [×]  │  ← RHS header (Mattermost)
├─────────────────────────────────────────┤
│ [Organization ▼]                        │  ← org selector (if >1 org)
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Description                         │ │
│ │ [ What have you worked on?        ] │ │
│ │ Project *  (or Project * │ Time)  │ │
│ │ [ Select project              ▾ ] │ │
│ │ Time: $ 15:40-16:40  Jun 29       │ │  ← narrow RHS: column
│ │ [ Manual | Timer ]    [ Add entry ] │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Week total: 00:00                    │  ← summary bar
├─────────────────────────────────────────┤
│ Today                                   │  ← day header
│ ┌─────────────────────────────────────┐ │
│ │ Test                    02:30:00    │ │
│ │ ● Project name — Client  $          │ │
│ │ 15:33 - 15:33  📅                   │ │
│ └─────────────────────────────────────┘ │
│                                         │  ← scrollable area
│ ...more entries...                      │
│                                         │
├─────────────────────────────────────────┤
│  ◄  Jun 23 – Jun 29, 2026  ►           │  ← fixed footer
└─────────────────────────────────────────┘
```

## Components

### 0. Connect Screen (`connect_panel.tsx`)

Shown in the RHS when the user is not connected:

```
┌─────────────────────────────────────────┐
│ Connect to Solidtime                    │
│                                         │
│ 1. Open your Solidtime profile ↗        │
│ 2. In Create API Token — generate token │
│ 3. Paste below and click Connect        │
│                                         │
│ API TOKEN                               │
│ [ •••••••••••••••••••••••••••••••• ]   │
│ [ Connect ]                             │
└─────────────────────────────────────────┘
```

- Profile link: `{SolidtimeServerURL}/user/profile`, `target="_blank"`.
- Token field — `type="password"`; button calls `POST /connection/connect`.
- WS `solidtime-connection-change` switches the RHS to the main layout.

### 0.1. Organization Selector (`org_selector.tsx`)

- `<select>` above the form; visible only when `organizations.length > 1`.
- On change: `PUT /organizations/current` → reset projects/entries → reload.
- Synced via WS `custom_{pluginId}_solidtime-org-change`.

### 1. Add Entry Form

Vertical stack: Description full width; **Project and Time** — on one row when form width ≥400px, otherwise stacked.

```
Narrow RHS (<400px)          Wide RHS (≥400px)
┌─────────────────────┐      ┌─────────────────────┐
│ DESCRIPTION         │      │ DESCRIPTION         │
│ [ What have you...] │      │ [ What have you...] │
│ PROJECT *           │      │ PROJECT * │ TIME    │
│ [ ● Idle Time   ▾ ] │      │ [ Idle ▾ ]│ $15:40📅│
│ TIME                │      │ [ Manual | Timer ]  │
│ $ 15:40 - 16:40 📅  │      │      [ Add entry ]  │
│ [ Manual | Timer ]  │      └─────────────────────┘
│      [ Add entry ]  │
└─────────────────────┘
```

**Fields**
- Description — full-width input with label.
- Project + Time — responsive row via CSS container query on `.solidtime-form`; in narrow mode the full date is visible, in wide mode only the calendar icon (`title` on hover).
- Project — field-style selector (border, chevron); placeholder «Select project».
- Time — panel: billable `$`, time range + date, or elapsed in Timer mode.

**Footer**
- Segmented control **Manual | Timer** (instead of hidden ⋮); choice persisted in `localStorage` per-user.
- Primary button: **Add entry** / **Start timer** / **Stop timer**.
- Manual mode unavailable while the timer is running.

#### Project Selection Dropdown

```
┌──────────────────────────────────┐
│ 🔍 Search Project or Client      │
├──────────────────────────────────┤
│ ▼ CLIENT NAME          1 Project ↗│
│   ● Project name                 ☆ │
├──────────────────────────────────┤
│ ▼ TEST                 1 Project ↗│
│   ● test                         ☆ │
└──────────────────────────────────┘
```

- Search by project and client name.
- Grouped by clients (collapsible headers).
- Colored dot (`●`) — project color from Solidtime.
- `☆` — favorite project toggle (localStorage `solidtime_favorites_{userId}`); favorites appear in a section at the top of the dropdown.
- Expanding a project shows the list of existing tasks for selection.

#### Row 2 (legacy inline in entry cards)

In list cards — compact inline layout (description + project link).

#### Date Picker

```
┌──────────────────────────────────┐
│  ◄  Jun 2026  ►                  │
├──────────────────────────────────┤
│ Mo Tu We Th Fr Sa Su             │
│                   1  2  3  4  5  │
│  6  7  8  9 10 11 12             │
│ 13 14 15 16 17 18 19             │
│ 20 21 22 23 24 25 26             │
│ 27 28 [29] 30  1  2  3           │
└──────────────────────────────────┘
```

- Popover attached to the calendar icon **in the time row** (to the right of `HH:mm - HH:mm`).
- Current date highlighted with a blue square.
- Dates from other months — gray.

#### Partial time input

Start and end time fields accept shorthand input (Solidtime-style). On **blur**, valid input is normalized to `HH:mm`; invalid input reverts to the previous value.

| Input | Result |
|-------|--------|
| `2` | `02:00` (whole number = hours) |
| `1.5` or `1,5` | `01:30` (decimal = fraction of hour) |
| `2:15` | `02:15` (`HH:mm` direct) |
| `1830` | `18:30` (compact `HHMM`, 3–4 digits) |
| `930` | `09:30` (compact `HMM`) |
| `0:10` | `00:10` (minutes via colon) |
| `0.16` | `00:10` (~10 minutes as decimal hours) |
| `10` | `10:00` (not 10 minutes — use `0:10` or `0.16` for minutes) |

#### Form reset after manual add

After a successful **Add entry** in Manual mode, description and task are cleared; project and billable are kept. Time fields advance by the last entry's duration:

| Submitted | Pre-filled next |
|-----------|-----------------|
| `14:30` – `15:30` | `15:30` – `16:30` |
| `15:30` – `17:00` | `17:00` – `18:30` |
| `10:00` – `15:30` | `15:30` – `21:00` |

The selected date is preserved. If the next end would cross midnight, end is capped at `23:59` on the same day.

### 2. Summary Bar

- Background: light gray (`#F0F0F0` / `--center-channel-bg`).
- Text: `Week total: HH:MM` (bold).
- Updates on load and after adding an entry.

### 3. Entry List

#### Day Header

- Background: slightly darker than the summary bar.
- Text: `Today`, `Yesterday`, or `Mon, Jun 23`.

#### Entry Card (inline editing)

Each list entry is an editable entity with the same fields as the add form. There is no separate "edit mode": fields can be changed directly in the card.

```
Test                              02:30:00  [×]
● Project name — Client    $
15:33 - 15:33  📅
```

- **×** button → **OK** — two-step delete confirmation (`DELETE /time-entries/{id}`).

| Field | UI Element | Behavior |
|------|------------|-----------|
| Description | `text input` | Current `description` value; placeholder same as add form |
| Project | project selector | Same dropdown as the form; `● {project_name} — {client_name}` |
| Billable | toggle `$` | Same as add form |
| Time and date | time range + `📅` | `HH:mm - HH:mm` and calendar button on one row; duration on the right recalculates when time changes; partial input normalized on blur (see [Partial time input](#partial-time-input)) |

**Saving Changes**

- On **blur** of input fields or on **value change** (toggle, dropdown selection, date/time picker) — sends `PUT /api/v1/time-entries/{id}` to the plugin.
- Plugin proxies the update to Solidtime (`PUT /organizations/{org_id}/time-entries/{id}`).
- While the request is in flight — field in loading/disabled state; on error — toast and revert to last saved value.
- Successful update — recalculates week total and, on date change, moves the entry to the correct day group.

### 4. Pagination Footer

- `position: sticky; bottom: 0` inside the RHS.
- Background matches the RHS.
- Top border (border-top).
- Content: chevron buttons and `{date range}` label.
- Arrows switch the week; entry list refreshes.

## Channel Header Button / Timer Widget

**Without an active timer:**
- Icon: Solidtime logo (SVG, ~24×24px).
- Click → open/close RHS.

**With an active timer** (`channel_header_timer.tsx`):
```
[■]  01:23
```
- **■** — STOP (`PUT` with `end: now`); hit-area **28×28px**, icon 14×14px, hover highlight.
- **01:23** — ticking elapsed (`HH:MM`); click → open/close RHS.
- Sync: mount, WS `solidtime-timer-change`, `GET /time-entries/active` on reconnect.

**General:**
- Visible only when the plugin is active with `SolidtimeServerURL` configured.
- On hover — tooltip «Open Solidtime Time Tracker».
- If multiple plugin buttons are registered — appears in the Mattermost dropdown.

## States and Feedback

| State | Behavior |
|-----------|-----------|
| Loading | Skeleton/spinner in the list area |
| Empty list | «No time entries for this period» |
| API error | Toast/alert with error description |
| Successful add | Form resets, list refreshes |
| Saving entry | Indicator on field; week total and day grouping update |
| Save entry error | Toast; field reverts to last saved value |
| No project selected | ADD button disabled, hint on selector |
| URL not configured | Plugin does not activate; button hidden |
| Not connected | Button visible; RHS — connect screen (`connect_panel`); API `not_connected` resets header timer |
| Entry deletion | Card disappears; week total recalculates |
| Org change | Projects/entries reload for the new org |
| Timer START | Header shows widget; form in Timer Mode — elapsed |
| Timer STOP | Entry appears in list with duration |

## Responsiveness

- Mattermost RHS has variable width; horizontal scroll is not allowed.
- Form: Project and Time in a column when width <400px, in a row when ≥400px (container query).
- On mobile devices the RHS opens full screen — usually enough for the Project+Time row.

## Component Files (plan)

```
webapp/src/components/
├── channel_header_button.tsx
├── channel_header_timer.tsx     # Timer widget in header
└── rhs/
    ├── sidebar.tsx
    ├── connect_panel.tsx        # Connect screen (not connected)
    ├── org_selector.tsx
    ├── time_entry_form.tsx
    ├── project_selector.tsx
    ├── date_picker.tsx
    ├── time_range_input.tsx
    ├── time_entry_list.tsx
    ├── time_entry_card.tsx
    ├── week_total_bar.tsx
    └── pagination_footer.tsx
webapp/src/
├── reducer.ts                   # activeTimer, entryMode, selectedOrgId
├── selectors.ts
└── utils/
    ├── time.ts                  # formatElapsed
    └── favorites.ts             # localStorage favorite projects
```
