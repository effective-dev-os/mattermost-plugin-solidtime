# Solidtime API Integration

Reference for the [Solidtime](https://www.solidtime.io/) REST API. Sources:

- [API access](https://docs.solidtime.io/user-guide/access-api) — creating and using API tokens
- [API reference](https://docs.solidtime.io/api-reference) — interactive documentation
- `docs/solidtime-openapi.json` — local copy of the OpenAPI 3.1 spec (68 endpoints)

---

## Authentication

The Solidtime API is RESTful. Access requires an **API token** (JWT) created in profile settings:

1. Profile Settings (bottom-left corner)
2. Create API Token → enter a name → Create API Token
3. Copy the token from the popup (shown **only once**)

Include the token in every request:

```http
Authorization: Bearer <api-token>
Accept: application/json
```

The Mattermost plugin stores the token in the server KV Store and injects it when proxying; the webapp never calls Solidtime directly.

### Token management via API

| Method | Path | Description |
|-------|------|----------|
| `GET` | `/users/me/api-tokens` | List user API tokens |
| `POST` | `/users/me/api-tokens` | Create token (`name`); `access_token` only in response |
| `POST` | `/users/me/api-tokens/{id}/revoke` | Revoke token |
| `DELETE` | `/users/me/api-tokens/{id}` | Delete token |

---

## Base URL and conventions

```
{SolidtimeServerURL}/api/v1
```

| Environment | URL |
|-----------|-----|
| Cloud | `https://app.solidtime.io/api/v1` |
| Self-hosted | `{your-domain}/api/v1` |
| Staging | `https://app.staging.solidtime.io/api/v1` |

**Conventions:**

- All dates/times are ISO 8601 UTC (`2024-02-26T09:00:00Z`); **no fractional seconds** (`.000` is rejected by the API)
- UUIDs for `organization`, `project`, `member`, `time_entry`, etc.
- Responses are wrapped in `{ "data": ... }`; paginated collections include `links`, `meta`
- `billable_rate` is in cents per hour
- `estimated_time`, `spent_time`, `duration` are in seconds
- Boolean query parameters are often passed as strings `'true'` / `'false'`
- Path `{organization}` is the organization ID; most endpoints are organization-scoped

---

## Endpoints used by the plugin

The plugin proxies a subset of the API. Other endpoints are documented below for reference.

### Connect / token validation

| Method | Path | Purpose |
|-------|------|------------|
| `GET` | `/users/me` | User profile (id, name, email, timezone, week_start) |
| `GET` | `/users/me/memberships` | List of organizations and **member_id** for each |

> `GET /organizations/{org_id}/members/me` **does not exist** in the API. Member ID comes from `GET /users/me/memberships`.

### RHS: projects, clients, tasks

| Method | Path | Purpose |
|-------|------|------------|
| `GET` | `/organizations/{org_id}/projects` | Project list (`?archived=false`) — used by plugin proxy |
| `GET` | `/organizations/{org_id}/clients` | Client list (`?archived=false`) |
| `GET` | `/organizations/{org_id}/tasks` | Task list (`?done=false`) — merged into projects on plugin server |

### RHS: time entries

| Method | Path | Purpose |
|-------|------|------------|
| `GET` | `/organizations/{org_id}/time-entries` | Entry list (filters, pagination) |
| `POST` | `/organizations/{org_id}/time-entries` | Create entry |
| `PUT` | `/organizations/{org_id}/time-entries/{id}` | Update (inline editing) |
| `DELETE` | `/organizations/{org_id}/time-entries/{id}` | Delete entry |
| `GET` | `/users/me/time-entries/active` | User's active (running) entry |
| `GET` | `/organizations/{org_id}/time-entries/aggregate` | Aggregation (week total) |

### Plugin examples

**Creating a time entry:**

```http
POST /api/v1/organizations/{organization_id}/time-entries
Authorization: Bearer <token>
Content-Type: application/json

{
  "member_id": "member-uuid",
  "project_id": "project-uuid",
  "task_id": "task-uuid",
  "description": "Working on feature X",
  "start": "2024-02-26T09:00:00Z",
  "end": "2024-02-26T12:30:00Z",
  "billable": true
}
```

Required fields: `member_id`, `start`, `billable`. `end: null` means a running timer.

**Active timer:**

```http
GET /api/v1/users/me/time-entries/active
Authorization: Bearer <token>
```

A `404` response means there is no active entry.

**Entry list:**

```http
GET /api/v1/organizations/{organization_id}/time-entries
    ?start=2024-02-01T00:00:00Z
    &end=2024-02-29T23:59:59Z
    &member_id={member_id}
    &limit=50
    &offset=0
Authorization: Bearer <token>
```

**Aggregation (Week Total):**

```http
GET /api/v1/organizations/{organization_id}/time-entries/aggregate
    ?start=2024-02-26T00:00:00Z
    &end=2024-03-04T23:59:59Z
    &group=day
    &member_id={member_id}
Authorization: Bearer <token>
```

### Mapping: UI → API

| UI field | API field | Transformation |
|---------|----------|----------------|
| Description | `description` | as-is |
| Project | `project_id` | UUID from selector |
| Task | `task_id` | UUID (optional) |
| Billable | `billable` | boolean |
| Start time | `start` | date + start time → ISO 8601 UTC |
| End time | `end` | date + end time → ISO 8601 UTC |
| Date | — | applied to `start` and `end` |

---

## Common data models

### UserResource

| Field | Type | Description |
|------|-----|----------|
| `id` | string | User ID |
| `name` | string | Name |
| `email` | string | Email |
| `profile_photo_url` | string | Avatar URL |
| `timezone` | string | Time zone (e.g. `Europe/Berlin`) |
| `week_start` | string | Week start (`monday`, `sunday`, …) |

### MemberResource

| Field | Type | Description |
|------|-----|----------|
| `id` | string | Membership ID (member_id for time entries) |
| `user_id` | string | User ID |
| `name` | string | Name |
| `email` | string | Email |
| `role` | string | Role (`owner`, `admin`, `employee`, …) |
| `is_placeholder` | boolean | Placeholder member |
| `billable_rate` | integer\|null | Rate in cents/hour |

### ProjectResource

| Field | Type | Description |
|------|-----|----------|
| `id` | string | Project ID |
| `name` | string | Name |
| `color` | string | Color (hex) |
| `client_id` | string\|null | Client ID |
| `is_archived` | boolean | Archived |
| `is_billable` | boolean | Billable by default |
| `billable_rate` | integer\|null | Project rate |
| `estimated_time` | integer\|null | Estimate, seconds |
| `spent_time` | integer | Spent, seconds |
| `is_public` | boolean | Public project |

### TaskResource

| Field | Type | Description |
|------|-----|----------|
| `id` | string | Task ID |
| `name` | string | Name |
| `is_done` | boolean | Done |
| `project_id` | string | Project ID |
| `estimated_time` | integer\|null | Estimate, seconds |
| `spent_time` | integer | Spent, seconds |

### TimeEntryResource

| Field | Type | Description |
|------|-----|----------|
| `id` | string | Entry ID |
| `start` | string | Start (ISO 8601 UTC) |
| `end` | string\|null | End; `null` = running timer |
| `duration` | integer\|null | Duration, seconds |
| `description` | string\|null | Description |
| `task_id` | string\|null | Task ID |
| `project_id` | string\|null | Project ID |
| `organization_id` | string | Organization ID |
| `user_id` | string | User ID |
| `tags` | array[string] | Tag IDs |
| `billable` | boolean | Billable |

### TimeEntryStoreRequest / TimeEntryUpdateRequest

| Field | Required (create) | Type | Description |
|------|----------------|-----|----------|
| `member_id` | yes | string | Organization member ID |
| `project_id` | no | string\|null | Project ID |
| `task_id` | no | string\|null | Task ID |
| `start` | yes | string | Start, UTC |
| `end` | no | string\|null | End; `null` = timer |
| `billable` | yes | boolean | Billable |
| `description` | no | string\|null | Description |
| `tags` | no | array\|null | Tag IDs |

---

## Full API reference

A total of **68** operations in **18** groups. Paths are relative to `/api/v1`.

### Summary table

| Group | Operations |
|--------|----------|
| API tokens (`ApiToken`) | 4 |
| Charts (dashboard) (`Chart`) | 9 |
| Clients (`Client`) | 4 |
| Currencies (`Currency`) | 1 |
| Organization export (`Export`) | 1 |
| Data import (`Import`) | 2 |
| Invitations (`Invitation`) | 4 |
| Organization members (`Member`) | 6 |
| Organizations (`Organization`) | 2 |
| Projects (`Project`) | 5 |
| Project members (`ProjectMember`) | 4 |
| Reports (`Report`) | 6 |
| Tags (`Tag`) | 4 |
| Tasks (`Task`) | 4 |
| Time entries (`TimeEntry`) | 9 |
| User (`User`) | 1 |
| User membership (`UserMembership`) | 1 |
| User time entries (`UserTimeEntry`) | 1 |

---

### API tokens

#### `GET` `/v1/users/me/api-tokens`

**List all api token of the currently authenticated user** — `getApiTokens`

This endpoint is independent of organization.

| Code | Description |
|-----|----------|
| `200` | `ApiTokenCollection` |
| `401` | Unauthenticated |
| `403` | Authorization error |

---

#### `POST` `/v1/users/me/api-tokens`

**Create a new api token for the currently authenticated user** — `createApiToken`

The response will contain the access token that can be used to send authenticated API requests.
Please note that the access token is only shown in this response and cannot be retrieved later.

**Request body:** `ApiTokenStoreRequest {name*: string}`

| Code | Description |
|-----|----------|
| `200` | `ApiTokenWithAccessTokenResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `422` | Validation error |

---

#### `DELETE` `/v1/users/me/api-tokens/{apiToken}`

**Delete an api token** — `deleteApiToken`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `apiToken` | path | string | yes | The api token ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `POST` `/v1/users/me/api-tokens/{apiToken}/revoke`

**Revoke an api token** — `revokeApiToken`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `apiToken` | path | string | yes | The api token ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Charts (dashboard)

#### `GET` `/v1/organizations/{organization}/charts/daily-tracked-hours`

**Get chart data for daily tracked hours** — `dailyTrackedHours`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/last-seven-days`

**Get chart data for the last seven days** — `lastSevenDays`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/latest-tasks`

**Get chart data for the latest tasks** — `latestTasks`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/latest-team-activity`

**Get chart data for the latest team activity** — `latestTeamActivity`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/total-weekly-billable-amount`

**Get chart data for total weekly billable amount** — `totalWeeklyBillableAmount`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/total-weekly-billable-time`

**Get chart data for total weekly billable time** — `totalWeeklyBillableTime`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/total-weekly-time`

**Get chart data for total weekly time** — `totalWeeklyTime`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/weekly-history`

**Get chart data for weekly history** — `weeklyHistory`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/weekly-project-overview`

**Get chart data for the weekly project overview** — `weeklyProjectOverview`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Clients

#### `GET` `/v1/organizations/{organization}/clients`

**Get clients** — `getClients`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `page` | query | integer | no |  |
| `archived` | query | string ('true', 'false', 'all') | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `ClientResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/clients`

**Create client** — `createClient`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `ClientStoreRequest {name*: string}`

| Code | Description |
|-----|----------|
| `200` | `ClientResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/clients/{client}`

**Delete client** — `deleteClient`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `client` | path | string | yes | The client ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/clients/{client}`

**Update client** — `updateClient`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `client` | path | string | yes | The client ID |

**Request body:** `ClientUpdateRequest {name*: string, is_archived: boolean}`

| Code | Description |
|-----|----------|
| `200` | `ClientResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Currencies

#### `GET` `/v1/currencies`

**Get all currencies** — `getCurrencies`

| Code | Description |
|-----|----------|
| `200` | — |

---

### Organization export

#### `POST` `/v1/organizations/{organization}/export`

**Export data of an organization** — `exportOrganization`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Data import

#### `POST` `/v1/organizations/{organization}/import`

**Import data into the organization** — `importData`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `ImportRequest {type*: string, data*: string}`

| Code | Description |
|-----|----------|
| `200` | — |
| `400` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/importers`

**Get information about available importers** — `getImporters`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Invitations

#### `GET` `/v1/organizations/{organization}/invitations`

**List all invitations of an organization** — `getInvitations`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `page` | query | integer | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `InvitationResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/invitations`

**Invite a user to the organization** — `invite`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `InvitationStoreRequest {email*: string, role*: string ('admin', 'manager', 'employee')}`

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/invitations/{invitation}`

**Remove a pending invitation** — `removeInvitation`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `invitation` | path | string | yes | The invitation ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `POST` `/v1/organizations/{organization}/invitations/{invitation}/resend`

**Resend email for a pending invitation** — `resendInvitationEmail`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `invitation` | path | string | yes | The invitation ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Organization members

#### `POST` `/v1/organizations/{organization}/member/{member}/merge-into`

**Merge one member into another** — `mergeMember`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `member` | path | string | yes | The member ID |

**Request body:** `MemberMergeIntoRequest {member_id: string}`

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/members`

**List all members of an organization** — `getMembers`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `page` | query | integer | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `MemberResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/members/{member}`

**Remove a member of the organization** — `removeMember`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `member` | path | string | yes | The member ID |
| `delete_related` | query | string ('true', 'false') | no |  |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `PUT` `/v1/organizations/{organization}/members/{member}`

**Update a member of the organization** — `updateMember`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `member` | path | string | yes | The member ID |

**Request body:** `MemberUpdateRequest {role: string ('owner', 'admin', 'manager', 'employee', 'placeholder'), billable_rate: integer|null}`

| Code | Description |
|-----|----------|
| `200` | `MemberResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/members/{member}/invite-placeholder`

**Invite a placeholder member to become a real member of the organization** — `invitePlaceholder`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `member` | path | string | yes | The member ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `POST` `/v1/organizations/{organization}/members/{member}/make-placeholder`

**Make a member a placeholder member** — `makePlaceholder`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `member` | path | string | yes | The member ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Organizations

#### `GET` `/v1/organizations/{organization}`

**Get organization** — `getOrganization`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

| Code | Description |
|-----|----------|
| `200` | `OrganizationResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}`

**Update organization** — `updateOrganization`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `OrganizationUpdateRequest {name: string, billable_rate: integer|null, employees_can_see_billable_rates: boolean, employees_can_manage_tasks: boolean, prevent_overlapping_time_entries: boolean, number_format: string ('point-comma', 'comma-point', 'space-comma', 'space-point', 'apostrophe-point'), currency_format: string ('iso-code-before-with-space', 'iso-code-after-with-space', 'symbol-before', 'symbol-after', 'symbol-before-with-space', 'symbol-after-with-space'), date_format: string ('point-separated-d-m-yyyy', 'slash-separated-mm-dd-yyyy', 'slash-separated-dd-mm-yyyy', 'hyphen-separated-dd-mm-yyyy', 'hyphen-separated-mm-dd-yyyy', 'hyphen-separated-yyyy-mm-dd'), interval_format: string ('decimal', 'hours-minutes', 'hours-minutes-colon-separated', 'hours-minutes-seconds-colon-separated'), time_format: string ('12-hours', '24-hours')}`

| Code | Description |
|-----|----------|
| `200` | `OrganizationResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Projects

#### `GET` `/v1/organizations/{organization}/projects`

**Get projects visible to the current user** — `getProjects`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `page` | query | integer | no |  |
| `archived` | query | string ('true', 'false', 'all') | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/projects`

**Create project** — `createProject`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `ProjectStoreRequest {name*: string, color*: string, is_billable*: boolean, billable_rate: integer|null, client_id: string|null, estimated_time: integer|null, is_public: boolean}`

| Code | Description |
|-----|----------|
| `200` | `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/projects/{project}`

**Delete project** — `deleteProject`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `project` | path | string | yes | The project ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/projects/{project}`

**Get project** — `getProject`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `project` | path | string | yes | The project ID |

| Code | Description |
|-----|----------|
| `200` | `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/projects/{project}`

**Update project** — `updateProject`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `project` | path | string | yes | The project ID |

**Request body:** `ProjectUpdateRequest {name*: string, color*: string, is_billable*: boolean, is_archived: boolean, is_public: boolean, client_id: string|null, billable_rate: integer|null, estimated_time: integer|null}`

| Code | Description |
|-----|----------|
| `200` | `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Project members

#### `DELETE` `/v1/organizations/{organization}/project-members/{projectMember}`

**Delete project member** — `deleteProjectMember`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `projectMember` | path | string | yes | The project member ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/project-members/{projectMember}`

**Update project member** — `updateProjectMember`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `projectMember` | path | string | yes | The project member ID |

**Request body:** `ProjectMemberUpdateRequest {billable_rate: integer|null}`

| Code | Description |
|-----|----------|
| `200` | `ProjectMemberResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/projects/{project}/project-members`

**Get project members for project** — `getProjectMembers`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `project` | path | string | yes | The project ID |
| `page` | query | integer | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `ProjectMemberResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/projects/{project}/project-members`

**Add project member to project** — `createProjectMember`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `project` | path | string | yes | The project ID |

**Request body:** `ProjectMemberStoreRequest {member_id*: string, billable_rate: integer|null}`

| Code | Description |
|-----|----------|
| `200` | `ProjectMemberResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Reports

#### `GET` `/v1/organizations/{organization}/reports`

**Get reports** — `getReports`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `page` | query | integer | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `ReportResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/reports`

**Create report** — `createReport`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `ReportStoreRequest {name*: string, description: string|null, is_public*: boolean, public_until: string|null, properties*: object}`

| Code | Description |
|-----|----------|
| `200` | `DetailedReportResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/reports/{report}`

**Delete report** — `deleteReport`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `report` | path | string | yes | The report ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/reports/{report}`

**Get report** — `getReport`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `report` | path | string | yes | The report ID |

| Code | Description |
|-----|----------|
| `200` | `DetailedReportResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/reports/{report}`

**Update report** — `updateReport`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `report` | path | string | yes | The report ID |

**Request body:** `ReportUpdateRequest {name: string, description: string|null, is_public: boolean, public_until: string|null}`

| Code | Description |
|-----|----------|
| `200` | `DetailedReportResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/public/reports`

**Get report by a share secret** — `getPublicReport`

This endpoint is public and does not require authentication. The report must be public and not expired.
The report is considered expired if the `public_until` field is set and the date is in the past.
The report is considered public if the `is_public` field is set to `true`.

| Code | Description |
|-----|----------|
| `200` | `DetailedWithDataReportResource` |
| `404` | Not found |

---

### Tags

#### `GET` `/v1/organizations/{organization}/tags`

**Get tags** — `getTags`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `page` | query | integer | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `TagResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/tags`

**Create tag** — `createTag`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `TagStoreRequest {name*: string}`

| Code | Description |
|-----|----------|
| `200` | `TagResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/tags/{tag}`

**Delete tag** — `deleteTag`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `tag` | path | string | yes | The tag ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/tags/{tag}`

**Update tag** — `updateTag`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `tag` | path | string | yes | The tag ID |

**Request body:** `TagUpdateRequest {name*: string}`

| Code | Description |
|-----|----------|
| `200` | `TagResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Tasks

#### `GET` `/v1/organizations/{organization}/tasks`

**Get tasks** — `getTasks`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `page` | query | integer | no |  |
| `project_id` | query | string | no |  |
| `done` | query | string ('true', 'false', 'all') | no |  |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `TaskResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/tasks`

**Create task** — `createTask`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `TaskStoreRequest {name*: string, project_id*: string, estimated_time: integer|null}`

| Code | Description |
|-----|----------|
| `200` | `TaskResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/tasks/{task}`

**Delete task** — `deleteTask`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `task` | path | string | yes | The task ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/tasks/{task}`

**Update task** — `updateTask`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `task` | path | string | yes | The task ID |

**Request body:** `TaskUpdateRequest {name*: string, is_done: boolean, estimated_time: integer|null}`

| Code | Description |
|-----|----------|
| `200` | `TaskResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Time entries

#### `DELETE` `/v1/organizations/{organization}/time-entries`

**Delete multiple time entries** — `deleteTimeEntries`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `ids` | query | array[string] | yes |  |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/time-entries`

**Get time entries in organization** — `getTimeEntries`

If you only need time entries for a specific user, you can filter by `user_id`.
Users with the permission `time-entries:view:own` can only use this endpoint with their own user ID in the user_id filter.

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `member_id` | query | string | no | Filter by member ID |
| `start` | query | string|null | no | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string|null | no | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | no | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | no | Filter by billable status |
| `limit` | query | integer | no | Limit the number of returned time entries (default: 150) |
| `offset` | query | integer | no | Skip the first n time entries (default: 0) |
| `only_full_dates` | query | string ('true', 'false') | no | Filter makes sure that only time entries of a whole date are returned |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | no | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | no | Defines the length of the interval that the time entry rounding rounds to. |
| `user_id` | query | string | no |  |
| `member_ids` | query | array[string] | no | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `client_ids` | query | array[string] | no | Filter by client IDs, client IDs are OR combined |
| `project_ids` | query | array[string] | no | Filter by project IDs, project IDs are OR combined |
| `tag_ids` | query | array[string] | no | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | no | Filter by task IDs, task IDs are OR combined |

| Code | Description |
|-----|----------|
| `200` | Paginated set of `TimeEntryResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `PATCH` `/v1/organizations/{organization}/time-entries`

**Update multiple time entries** — `updateMultipleTimeEntries`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `TimeEntryUpdateMultipleRequest {ids*: array[string], changes*: object}`

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/time-entries`

**Create time entry** — `createTimeEntry`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |

**Request body:** `TimeEntryStoreRequest {member_id*: string, project_id: string|null, task_id: string|null, start*: string, end: string|null, billable*: boolean, description: string|null, tags: array|null}`

| Code | Description |
|-----|----------|
| `200` | `TimeEntryResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/time-entries/aggregate`

**Get aggregated time entries in organization** — `getAggregatedTimeEntries`

This endpoint allows you to filter time entries and aggregate them by different criteria.
The parameters `group` and `sub_group` allow you to group the time entries by different criteria.
If the group parameters are all set to `null` or are all missing, the endpoint will aggregate all filtered time entries.

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `group` | query | string|null ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | no | Type of first grouping |
| `sub_group` | query | string|null ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | no | Type of second grouping |
| `member_id` | query | string | no | Filter by member ID |
| `user_id` | query | string | no | Filter by user ID |
| `start` | query | string|null | no | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string|null | no | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | no | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | no | Filter by billable status |
| `fill_gaps_in_time_groups` | query | string ('true', 'false') | no |  |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | no | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | no | Defines the length of the interval that the time entry rounding rounds to. |
| `member_ids` | query | array[string] | no | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `project_ids` | query | array[string] | no | Filter by project IDs, project IDs are OR combined |
| `client_ids` | query | array[string] | no | Filter by client IDs, client IDs are OR combined |
| `tag_ids` | query | array[string] | no | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | no | Filter by task IDs, task IDs are OR combined |

| Code | Description |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/time-entries/aggregate/export`

**Export aggregated time entries in organization** — `exportAggregatedTimeEntries`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `format` | query | string ('csv', 'pdf', 'xlsx', 'ods') | yes | Data format of the export |
| `group` | query | string ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | yes | Type of first grouping |
| `sub_group` | query | string ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | yes | Type of second grouping |
| `history_group` | query | string|null ('day', 'week', 'month', 'year') | yes | Type of grouping of the historic aggregation (time chart) |
| `member_id` | query | string | no | Filter by member ID |
| `user_id` | query | string | no | Filter by user ID |
| `start` | query | string | yes | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string | yes | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | no | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | no | Filter by billable status |
| `fill_gaps_in_time_groups` | query | string ('true', 'false') | no |  |
| `debug` | query | string ('true', 'false') | no |  |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | no | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | no | Defines the length of the interval that the time entry rounding rounds to. |
| `member_ids` | query | array[string] | no | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `project_ids` | query | array[string] | no | Filter by project IDs, project IDs are OR combined |
| `client_ids` | query | array[string] | no | Filter by client IDs, client IDs are OR combined |
| `tag_ids` | query | array[string] | no | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | no | Filter by task IDs, task IDs are OR combined |

| Code | Description |
|-----|----------|
| `200` | — |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/time-entries/export`

**Export time entries in organization** — `exportTimeEntries`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `format` | query | string ('csv', 'pdf', 'xlsx', 'ods') | yes |  |
| `member_id` | query | string | no | Filter by member ID |
| `start` | query | string | yes | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string | yes | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | no | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | no | Filter by billable status |
| `limit` | query | integer | no | Limit the number of returned time entries (default: 150) |
| `only_full_dates` | query | string ('true', 'false') | no | Filter makes sure that only time entries of a whole date are returned |
| `debug` | query | string ('true', 'false') | no |  |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | no | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | no | Defines the length of the interval that the time entry rounding rounds to. |
| `member_ids` | query | array[string] | no | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `client_ids` | query | array[string] | no | Filter by client IDs, client IDs are OR combined |
| `project_ids` | query | array[string] | no | Filter by project IDs, project IDs are OR combined |
| `tag_ids` | query | array[string] | no | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | no | Filter by task IDs, task IDs are OR combined |

| Code | Description |
|-----|----------|
| `200` | — |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/time-entries/{timeEntry}`

**Delete time entry** — `deleteTimeEntry`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `timeEntry` | path | string | yes | The time entry ID |

| Code | Description |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/time-entries/{timeEntry}`

**Update time entry** — `updateTimeEntry`

| Parameter | In | Type | Required | Description |
|---|---|---|---|---|
| `organization` | path | string | yes | The organization ID |
| `timeEntry` | path | string | yes | The time entry ID |

**Request body:** `TimeEntryUpdateRequest {member_id: string, project_id: string|null, task_id: string|null, start: string, end: string|null, billable: boolean, description: string|null, tags: array|null}`

| Code | Description |
|-----|----------|
| `200` | `TimeEntryResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### User

#### `GET` `/v1/users/me`

**Get the current user** — `getMe`

This endpoint is independent of organization.

| Code | Description |
|-----|----------|
| `200` | `UserResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |

---

### User membership

#### `GET` `/v1/users/me/memberships`

**Get the memberships of the current user** — `getMyMemberships`

This endpoint is independent of organization.

| Code | Description |
|-----|----------|
| `200` | `PersonalMembershipCollection` |
| `401` | Unauthenticated |
| `403` | Authorization error |

---

### User time entries

#### `GET` `/v1/users/me/time-entries/active`

**Get the active time entry of the current user** — `getMyActiveTimeEntry`

This endpoint is independent of organization.

| Code | Description |
|-----|----------|
| `200` | `TimeEntryResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

## Error handling

| HTTP | Meaning | Plugin action |
|------|----------|------------------|
| `401` | Unauthorized | Invalid token → `/solidtime connect` |
| `403` | Forbidden | Ephemeral: "Insufficient permissions in Solidtime" |
| `404` | Not found | Log; show a clear error |
| `422` | Validation error | Show errors from the response body |
| `5xx` | Server error | "Solidtime server unavailable" |

Typical API errors (from OpenAPI): `AuthenticationException`, `AuthorizationException`, `ValidationException`, `ModelNotFoundException`, `OverlappingTimeEntryApiException`, `EntityStillInUseApiException`.

---

## Proxying in the plugin

```
Webapp  →  /plugins/{plugin_id}/api/v1/...
Server  →  {SolidtimeServerURL}/api/v1/...
```

### Plugin endpoints (Phase 2)

| Method | Plugin path | Description |
|-------|--------------|----------|
| `GET` | `/api/v1/connection/status` | `{connected, server_url}` |
| `POST` | `/api/v1/connection/connect` | `{token}` → connect + WS |
| `DELETE` | `/api/v1/connection/disconnect` | disconnect + WS |
| `GET` | `/api/v1/organizations` | KV-cached memberships (no upstream) |
| `PUT` | `/api/v1/organizations/current` | KV update + WS `solidtime-org-change` |
| `GET` | `/api/v1/projects` | `GET /organizations/{org}/projects?archived=false` + `GET /organizations/{org}/tasks?done=false` (+ clients); tasks merged by `project_id` |
| `GET` | `/api/v1/time-entries` | `GET /organizations/{org}/time-entries` (multi-page, ≤500) |
| `GET` | `/api/v1/time-entries/active` | `GET /users/me/time-entries/active` |
| `POST` | `/api/v1/time-entries` | `POST /organizations/{org}/time-entries` |
| `PUT` | `/api/v1/time-entries/{id}` | `PUT /organizations/{org}/time-entries/{id}` |
| `DELETE` | `/api/v1/time-entries/{id}` | `DELETE /organizations/{org}/time-entries/{id}` |
| `GET` | `/api/v1/time-entries/aggregate` | `GET /organizations/{org}/time-entries/aggregate` |

### WebSocket events (server → webapp)

| Event | When | Payload |
|---------|-------|---------|
| `solidtime-connection-change` | connect / disconnect | `{connected: bool}` |
| `solidtime-org-change` | org change | `{organization_id}` |
| `solidtime-timer-change` | start / stop / delete active entry | `{active: TimeEntry\|null}` |

Benefits: the token never leaves the server; a single logging point; caching is possible (projects, clients, memberships).
