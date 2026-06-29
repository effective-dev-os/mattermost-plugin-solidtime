# Интеграция с Solidtime API

Справочник по REST API [Solidtime](https://www.solidtime.io/). Источники:

- [API access](https://docs.solidtime.io/user-guide/access-api) — создание и использование токена
- [API reference](https://docs.solidtime.io/api-reference) — интерактивная документация
- `docs/solidtime-openapi.json` — локальная копия OpenAPI 3.1 спецификации (68 эндпоинтов)

---

## Аутентификация

API Solidtime — RESTful. Для доступа нужен **API token** (JWT), создаваемый в настройках профиля:

1. Profile Settings (левый нижний угол)
2. Create API Token → ввести имя → Create API Token
3. Скопировать токен из popup (показывается **один раз**)

Передача токена в каждом запросе:

```http
Authorization: Bearer <api-token>
Accept: application/json
```

Плагин Mattermost хранит токен в server KV Store и подставляет его при проксировании; webapp к Solidtime напрямую не обращается.

### Управление токенами через API

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/users/me/api-tokens` | Список токенов пользователя |
| `POST` | `/users/me/api-tokens` | Создать токен (`name`); `access_token` только в ответе |
| `POST` | `/users/me/api-tokens/{id}/revoke` | Отозвать токен |
| `DELETE` | `/users/me/api-tokens/{id}` | Удалить токен |

---

## Базовый URL и соглашения

```
{SolidtimeServerURL}/api/v1
```

| Окружение | URL |
|-----------|-----|
| Cloud | `https://app.solidtime.io/api/v1` |
| Self-hosted | `{your-domain}/api/v1` |
| Staging | `https://app.staging.solidtime.io/api/v1` |

**Соглашения:**

- Все даты/время — ISO 8601 UTC (`2024-02-26T09:00:00Z`)
- UUID для `organization`, `project`, `member`, `time_entry` и т.д.
- Ответы обёрнуты в `{ "data": ... }`; коллекции с пагинацией — `links`, `meta`
- `billable_rate` — в центах в час
- `estimated_time`, `spent_time`, `duration` — в секундах
- Query-параметры boolean часто передаются строками `'true'` / `'false'`
- Path `{organization}` — ID организации; большинство эндпоинтов привязаны к организации

---

## Эндпоинты, используемые плагином

Плагин проксирует подмножество API. Остальные эндпоинты документированы ниже для справки.

### Connect / валидация токена

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/users/me` | Профиль пользователя (id, name, email, timezone, week_start) |
| `GET` | `/users/me/memberships` | Список организаций и **member_id** для каждой |

> `GET /organizations/{org_id}/members/me` **не существует** в API. Member ID берётся из `GET /users/me/memberships`.

### RHS: проекты, клиенты, задачи

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/organizations/{org_id}/projects` | Список проектов (`?archived=false`) |
| `GET` | `/organizations/{org_id}/clients` | Список клиентов (`?archived=false`) |
| `GET` | `/organizations/{org_id}/tasks` | Задачи (`?project_id=...&done=false`) |

### RHS: time entries

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET` | `/organizations/{org_id}/time-entries` | Список записей (фильтры, пагинация) |
| `POST` | `/organizations/{org_id}/time-entries` | Создание записи |
| `PUT` | `/organizations/{org_id}/time-entries/{id}` | Обновление (inline-редактирование) |
| `DELETE` | `/organizations/{org_id}/time-entries/{id}` | Удаление (будущий функционал) |
| `GET` | `/organizations/{org_id}/time-entries/aggregate` | Агрегация (week total) |

### Примеры для плагина

**Создание time entry:**

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

Обязательные поля: `member_id`, `start`, `billable`. `end: null` — running timer (вне scope плагина).

**Список записей:**

```http
GET /api/v1/organizations/{organization_id}/time-entries
    ?start=2024-02-01T00:00:00Z
    &end=2024-02-29T23:59:59Z
    &member_id={member_id}
    &limit=50
    &offset=0
Authorization: Bearer <token>
```

**Агрегация (Week Total):**

```http
GET /api/v1/organizations/{organization_id}/time-entries/aggregate
    ?start=2024-02-26T00:00:00Z
    &end=2024-03-04T23:59:59Z
    &group=day
    &member_id={member_id}
Authorization: Bearer <token>
```

### Маппинг: UI → API

| Поле UI | Поле API | Преобразование |
|---------|----------|----------------|
| Описание | `description` | as-is |
| Проект | `project_id` | UUID из селектора |
| Задача | `task_id` | UUID (опционально) |
| Billable | `billable` | boolean |
| Время начала | `start` | date + start time → ISO 8601 UTC |
| Время конца | `end` | date + end time → ISO 8601 UTC |
| Дата | — | применяется к `start` и `end` |

---

## Общие модели данных

### UserResource

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | ID пользователя |
| `name` | string | Имя |
| `email` | string | Email |
| `profile_photo_url` | string | URL аватара |
| `timezone` | string | Часовой пояс (напр. `Europe/Berlin`) |
| `week_start` | string | Начало недели (`monday`, `sunday`, …) |

### MemberResource

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | ID членства (member_id для time entries) |
| `user_id` | string | ID пользователя |
| `name` | string | Имя |
| `email` | string | Email |
| `role` | string | Роль (`owner`, `admin`, `employee`, …) |
| `is_placeholder` | boolean | Placeholder-участник |
| `billable_rate` | integer\|null | Ставка в центах/час |

### ProjectResource

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | ID проекта |
| `name` | string | Название |
| `color` | string | Цвет (hex) |
| `client_id` | string\|null | ID клиента |
| `is_archived` | boolean | Архивирован |
| `is_billable` | boolean | Billable по умолчанию |
| `billable_rate` | integer\|null | Ставка проекта |
| `estimated_time` | integer\|null | Оценка, секунды |
| `spent_time` | integer | Затрачено, секунды |
| `is_public` | boolean | Публичный проект |

### TaskResource

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | ID задачи |
| `name` | string | Название |
| `is_done` | boolean | Выполнена |
| `project_id` | string | ID проекта |
| `estimated_time` | integer\|null | Оценка, секунды |
| `spent_time` | integer | Затрачено, секунды |

### TimeEntryResource

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | ID записи |
| `start` | string | Начало (ISO 8601 UTC) |
| `end` | string\|null | Конец; `null` = running timer |
| `duration` | integer\|null | Длительность, секунды |
| `description` | string\|null | Описание |
| `task_id` | string\|null | ID задачи |
| `project_id` | string\|null | ID проекта |
| `organization_id` | string | ID организации |
| `user_id` | string | ID пользователя |
| `tags` | array[string] | ID тегов |
| `billable` | boolean | Billable |

### TimeEntryStoreRequest / TimeEntryUpdateRequest

| Поле | Обяз. (create) | Тип | Описание |
|------|----------------|-----|----------|
| `member_id` | да | string | ID участника организации |
| `project_id` | нет | string\|null | ID проекта |
| `task_id` | нет | string\|null | ID задачи |
| `start` | да | string | Начало, UTC |
| `end` | нет | string\|null | Конец; `null` = timer |
| `billable` | да | boolean | Billable |
| `description` | нет | string\|null | Описание |
| `tags` | нет | array\|null | ID тегов |

---

## Полный справочник API

Всего **68** операций в **18** группах. Пути указаны относительно `/api/v1`.

### Сводная таблица

| Группа | Операций |
|--------|----------|
| API-токены (`ApiToken`) | 4 |
| Графики (дашборд) (`Chart`) | 9 |
| Клиенты (`Client`) | 4 |
| Валюты (`Currency`) | 1 |
| Экспорт организации (`Export`) | 1 |
| Импорт данных (`Import`) | 2 |
| Приглашения (`Invitation`) | 4 |
| Участники организации (`Member`) | 6 |
| Организации (`Organization`) | 2 |
| Проекты (`Project`) | 5 |
| Участники проекта (`ProjectMember`) | 4 |
| Отчёты (`Report`) | 6 |
| Теги (`Tag`) | 4 |
| Задачи (`Task`) | 4 |
| Записи времени (`TimeEntry`) | 9 |
| Пользователь (`User`) | 1 |
| Членство пользователя (`UserMembership`) | 1 |
| Записи времени пользователя (`UserTimeEntry`) | 1 |

---

### API-токены

#### `GET` `/v1/users/me/api-tokens`

**List all api token of the currently authenticated user** — `getApiTokens`

This endpoint is independent of organization.

| Код | Описание |
|-----|----------|
| `200` | `ApiTokenCollection` |
| `401` | Unauthenticated |
| `403` | Authorization error |

---

#### `POST` `/v1/users/me/api-tokens`

**Create a new api token for the currently authenticated user** — `createApiToken`

The response will contain the access token that can be used to send authenticated API requests.
Please note that the access token is only shown in this response and cannot be retrieved later.

**Тело запроса:** `ApiTokenStoreRequest {name*: string}`

| Код | Описание |
|-----|----------|
| `200` | `ApiTokenWithAccessTokenResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `422` | Validation error |

---

#### `DELETE` `/v1/users/me/api-tokens/{apiToken}`

**Delete an api token** — `deleteApiToken`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `apiToken` | path | string | да | The api token ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `POST` `/v1/users/me/api-tokens/{apiToken}/revoke`

**Revoke an api token** — `revokeApiToken`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `apiToken` | path | string | да | The api token ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Графики (дашборд)

#### `GET` `/v1/organizations/{organization}/charts/daily-tracked-hours`

**Get chart data for daily tracked hours** — `dailyTrackedHours`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/last-seven-days`

**Get chart data for the last seven days** — `lastSevenDays`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/latest-tasks`

**Get chart data for the latest tasks** — `latestTasks`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/latest-team-activity`

**Get chart data for the latest team activity** — `latestTeamActivity`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/total-weekly-billable-amount`

**Get chart data for total weekly billable amount** — `totalWeeklyBillableAmount`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/total-weekly-billable-time`

**Get chart data for total weekly billable time** — `totalWeeklyBillableTime`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/total-weekly-time`

**Get chart data for total weekly time** — `totalWeeklyTime`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/weekly-history`

**Get chart data for weekly history** — `weeklyHistory`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/charts/weekly-project-overview`

**Get chart data for the weekly project overview** — `weeklyProjectOverview`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Клиенты

#### `GET` `/v1/organizations/{organization}/clients`

**Get clients** — `getClients`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `page` | query | integer | нет |  |
| `archived` | query | string ('true', 'false', 'all') | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `ClientResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/clients`

**Create client** — `createClient`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `ClientStoreRequest {name*: string}`

| Код | Описание |
|-----|----------|
| `200` | `ClientResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/clients/{client}`

**Delete client** — `deleteClient`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `client` | path | string | да | The client ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/clients/{client}`

**Update client** — `updateClient`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `client` | path | string | да | The client ID |

**Тело запроса:** `ClientUpdateRequest {name*: string, is_archived: boolean}`

| Код | Описание |
|-----|----------|
| `200` | `ClientResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Валюты

#### `GET` `/v1/currencies`

**Get all currencies** — `getCurrencies`

| Код | Описание |
|-----|----------|
| `200` | — |

---

### Экспорт организации

#### `POST` `/v1/organizations/{organization}/export`

**Export data of an organization** — `exportOrganization`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Импорт данных

#### `POST` `/v1/organizations/{organization}/import`

**Import data into the organization** — `importData`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `ImportRequest {type*: string, data*: string}`

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Приглашения

#### `GET` `/v1/organizations/{organization}/invitations`

**List all invitations of an organization** — `getInvitations`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `page` | query | integer | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `InvitationResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/invitations`

**Invite a user to the organization** — `invite`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `InvitationStoreRequest {email*: string, role*: string ('admin', 'manager', 'employee')}`

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `invitation` | path | string | да | The invitation ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `POST` `/v1/organizations/{organization}/invitations/{invitation}/resend`

**Resend email for a pending invitation** — `resendInvitationEmail`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `invitation` | path | string | да | The invitation ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Участники организации

#### `POST` `/v1/organizations/{organization}/member/{member}/merge-into`

**Merge one member into another** — `mergeMember`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `member` | path | string | да | The member ID |

**Тело запроса:** `MemberMergeIntoRequest {member_id: string}`

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `page` | query | integer | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `MemberResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/members/{member}`

**Remove a member of the organization** — `removeMember`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `member` | path | string | да | The member ID |
| `delete_related` | query | string ('true', 'false') | нет |  |

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `member` | path | string | да | The member ID |

**Тело запроса:** `MemberUpdateRequest {role: string ('owner', 'admin', 'manager', 'employee', 'placeholder'), billable_rate: integer|null}`

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `member` | path | string | да | The member ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `POST` `/v1/organizations/{organization}/members/{member}/make-placeholder`

**Make a member a placeholder member** — `makePlaceholder`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `member` | path | string | да | The member ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

### Организации

#### `GET` `/v1/organizations/{organization}`

**Get organization** — `getOrganization`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

| Код | Описание |
|-----|----------|
| `200` | `OrganizationResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}`

**Update organization** — `updateOrganization`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `OrganizationUpdateRequest {name: string, billable_rate: integer|null, employees_can_see_billable_rates: boolean, employees_can_manage_tasks: boolean, prevent_overlapping_time_entries: boolean, number_format: string ('point-comma', 'comma-point', 'space-comma', 'space-point', 'apostrophe-point'), currency_format: string ('iso-code-before-with-space', 'iso-code-after-with-space', 'symbol-before', 'symbol-after', 'symbol-before-with-space', 'symbol-after-with-space'), date_format: string ('point-separated-d-m-yyyy', 'slash-separated-mm-dd-yyyy', 'slash-separated-dd-mm-yyyy', 'hyphen-separated-dd-mm-yyyy', 'hyphen-separated-mm-dd-yyyy', 'hyphen-separated-yyyy-mm-dd'), interval_format: string ('decimal', 'hours-minutes', 'hours-minutes-colon-separated', 'hours-minutes-seconds-colon-separated'), time_format: string ('12-hours', '24-hours')}`

| Код | Описание |
|-----|----------|
| `200` | `OrganizationResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Проекты

#### `GET` `/v1/organizations/{organization}/projects`

**Get projects visible to the current user** — `getProjects`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `page` | query | integer | нет |  |
| `archived` | query | string ('true', 'false', 'all') | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/projects`

**Create project** — `createProject`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `ProjectStoreRequest {name*: string, color*: string, is_billable*: boolean, billable_rate: integer|null, client_id: string|null, estimated_time: integer|null, is_public: boolean}`

| Код | Описание |
|-----|----------|
| `200` | `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/projects/{project}`

**Delete project** — `deleteProject`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `project` | path | string | да | The project ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/projects/{project}`

**Get project** — `getProject`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `project` | path | string | да | The project ID |

| Код | Описание |
|-----|----------|
| `200` | `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/projects/{project}`

**Update project** — `updateProject`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `project` | path | string | да | The project ID |

**Тело запроса:** `ProjectUpdateRequest {name*: string, color*: string, is_billable*: boolean, is_archived: boolean, is_public: boolean, client_id: string|null, billable_rate: integer|null, estimated_time: integer|null}`

| Код | Описание |
|-----|----------|
| `200` | `ProjectResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Участники проекта

#### `DELETE` `/v1/organizations/{organization}/project-members/{projectMember}`

**Delete project member** — `deleteProjectMember`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `projectMember` | path | string | да | The project member ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/project-members/{projectMember}`

**Update project member** — `updateProjectMember`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `projectMember` | path | string | да | The project member ID |

**Тело запроса:** `ProjectMemberUpdateRequest {billable_rate: integer|null}`

| Код | Описание |
|-----|----------|
| `200` | `ProjectMemberResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/projects/{project}/project-members`

**Get project members for project** — `getProjectMembers`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `project` | path | string | да | The project ID |
| `page` | query | integer | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `ProjectMemberResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/projects/{project}/project-members`

**Add project member to project** — `createProjectMember`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `project` | path | string | да | The project ID |

**Тело запроса:** `ProjectMemberStoreRequest {member_id*: string, billable_rate: integer|null}`

| Код | Описание |
|-----|----------|
| `200` | `ProjectMemberResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Отчёты

#### `GET` `/v1/organizations/{organization}/reports`

**Get reports** — `getReports`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `page` | query | integer | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `ReportResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/reports`

**Create report** — `createReport`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `ReportStoreRequest {name*: string, description: string|null, is_public*: boolean, public_until: string|null, properties*: object}`

| Код | Описание |
|-----|----------|
| `200` | `DetailedReportResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/reports/{report}`

**Delete report** — `deleteReport`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `report` | path | string | да | The report ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `GET` `/v1/organizations/{organization}/reports/{report}`

**Get report** — `getReport`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `report` | path | string | да | The report ID |

| Код | Описание |
|-----|----------|
| `200` | `DetailedReportResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/reports/{report}`

**Update report** — `updateReport`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `report` | path | string | да | The report ID |

**Тело запроса:** `ReportUpdateRequest {name: string, description: string|null, is_public: boolean, public_until: string|null}`

| Код | Описание |
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

| Код | Описание |
|-----|----------|
| `200` | `DetailedWithDataReportResource` |
| `404` | Not found |

---

### Теги

#### `GET` `/v1/organizations/{organization}/tags`

**Get tags** — `getTags`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `page` | query | integer | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `TagResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/tags`

**Create tag** — `createTag`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `TagStoreRequest {name*: string}`

| Код | Описание |
|-----|----------|
| `200` | `TagResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/tags/{tag}`

**Delete tag** — `deleteTag`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `tag` | path | string | да | The tag ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/tags/{tag}`

**Update tag** — `updateTag`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `tag` | path | string | да | The tag ID |

**Тело запроса:** `TagUpdateRequest {name*: string}`

| Код | Описание |
|-----|----------|
| `200` | `TagResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Задачи

#### `GET` `/v1/organizations/{organization}/tasks`

**Get tasks** — `getTasks`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `page` | query | integer | нет |  |
| `project_id` | query | string | нет |  |
| `done` | query | string ('true', 'false', 'all') | нет |  |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `TaskResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/tasks`

**Create task** — `createTask`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `TaskStoreRequest {name*: string, project_id*: string, estimated_time: integer|null}`

| Код | Описание |
|-----|----------|
| `200` | `TaskResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `DELETE` `/v1/organizations/{organization}/tasks/{task}`

**Delete task** — `deleteTask`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `task` | path | string | да | The task ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/tasks/{task}`

**Update task** — `updateTask`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `task` | path | string | да | The task ID |

**Тело запроса:** `TaskUpdateRequest {name*: string, is_done: boolean, estimated_time: integer|null}`

| Код | Описание |
|-----|----------|
| `200` | `TaskResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Записи времени

#### `DELETE` `/v1/organizations/{organization}/time-entries`

**Delete multiple time entries** — `deleteTimeEntries`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `ids` | query | array[string] | да |  |

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `member_id` | query | string | нет | Filter by member ID |
| `start` | query | string|null | нет | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string|null | нет | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | нет | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | нет | Filter by billable status |
| `limit` | query | integer | нет | Limit the number of returned time entries (default: 150) |
| `offset` | query | integer | нет | Skip the first n time entries (default: 0) |
| `only_full_dates` | query | string ('true', 'false') | нет | Filter makes sure that only time entries of a whole date are returned |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | нет | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | нет | Defines the length of the interval that the time entry rounding rounds to. |
| `user_id` | query | string | нет |  |
| `member_ids` | query | array[string] | нет | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `client_ids` | query | array[string] | нет | Filter by client IDs, client IDs are OR combined |
| `project_ids` | query | array[string] | нет | Filter by project IDs, project IDs are OR combined |
| `tag_ids` | query | array[string] | нет | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | нет | Filter by task IDs, task IDs are OR combined |

| Код | Описание |
|-----|----------|
| `200` | Paginated set of `TimeEntryResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `PATCH` `/v1/organizations/{organization}/time-entries`

**Update multiple time entries** — `updateMultipleTimeEntries`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `TimeEntryUpdateMultipleRequest {ids*: array[string], changes*: object}`

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `POST` `/v1/organizations/{organization}/time-entries`

**Create time entry** — `createTimeEntry`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |

**Тело запроса:** `TimeEntryStoreRequest {member_id*: string, project_id: string|null, task_id: string|null, start*: string, end: string|null, billable*: boolean, description: string|null, tags: array|null}`

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `group` | query | string|null ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | нет | Type of first grouping |
| `sub_group` | query | string|null ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | нет | Type of second grouping |
| `member_id` | query | string | нет | Filter by member ID |
| `user_id` | query | string | нет | Filter by user ID |
| `start` | query | string|null | нет | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string|null | нет | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | нет | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | нет | Filter by billable status |
| `fill_gaps_in_time_groups` | query | string ('true', 'false') | нет |  |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | нет | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | нет | Defines the length of the interval that the time entry rounding rounds to. |
| `member_ids` | query | array[string] | нет | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `project_ids` | query | array[string] | нет | Filter by project IDs, project IDs are OR combined |
| `client_ids` | query | array[string] | нет | Filter by client IDs, client IDs are OR combined |
| `tag_ids` | query | array[string] | нет | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | нет | Filter by task IDs, task IDs are OR combined |

| Код | Описание |
|-----|----------|
| `200` | — |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

#### `GET` `/v1/organizations/{organization}/time-entries/aggregate/export`

**Export aggregated time entries in organization** — `exportAggregatedTimeEntries`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `format` | query | string ('csv', 'pdf', 'xlsx', 'ods') | да | Data format of the export |
| `group` | query | string ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | да | Type of first grouping |
| `sub_group` | query | string ('day', 'week', 'month', 'year', 'user', 'project', 'task', 'client', 'billable', 'description', 'tag') | да | Type of second grouping |
| `history_group` | query | string|null ('day', 'week', 'month', 'year') | да | Type of grouping of the historic aggregation (time chart) |
| `member_id` | query | string | нет | Filter by member ID |
| `user_id` | query | string | нет | Filter by user ID |
| `start` | query | string | да | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string | да | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | нет | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | нет | Filter by billable status |
| `fill_gaps_in_time_groups` | query | string ('true', 'false') | нет |  |
| `debug` | query | string ('true', 'false') | нет |  |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | нет | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | нет | Defines the length of the interval that the time entry rounding rounds to. |
| `member_ids` | query | array[string] | нет | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `project_ids` | query | array[string] | нет | Filter by project IDs, project IDs are OR combined |
| `client_ids` | query | array[string] | нет | Filter by client IDs, client IDs are OR combined |
| `tag_ids` | query | array[string] | нет | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | нет | Filter by task IDs, task IDs are OR combined |

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `format` | query | string ('csv', 'pdf', 'xlsx', 'ods') | да |  |
| `member_id` | query | string | нет | Filter by member ID |
| `start` | query | string | да | Filter only time entries that have a start date after the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `end` | query | string | да | Filter only time entries that have a start date before the given timestamp in UTC (example: 2021-01-01T00:00:00Z) |
| `active` | query | string ('true', 'false') | нет | Filter by active status (active means has no end date, is still running) |
| `billable` | query | string ('true', 'false') | нет | Filter by billable status |
| `limit` | query | integer | нет | Limit the number of returned time entries (default: 150) |
| `only_full_dates` | query | string ('true', 'false') | нет | Filter makes sure that only time entries of a whole date are returned |
| `debug` | query | string ('true', 'false') | нет |  |
| `rounding_type` | query | string|null ('up', 'down', 'nearest') | нет | Rounding type defined where the end of each time entry should be rounded to. For example: nearest rounds the end to the nearest x minutes group. Rounding per time entry is activated if `rounding_type` and `rounding_minutes` is not null. |
| `rounding_minutes` | query | integer|null | нет | Defines the length of the interval that the time entry rounding rounds to. |
| `member_ids` | query | array[string] | нет | Filter by multiple member IDs, member IDs are OR combined, but AND combined with the member_id parameter |
| `client_ids` | query | array[string] | нет | Filter by client IDs, client IDs are OR combined |
| `project_ids` | query | array[string] | нет | Filter by project IDs, project IDs are OR combined |
| `tag_ids` | query | array[string] | нет | Filter by tag IDs, tag IDs are OR combined |
| `task_ids` | query | array[string] | нет | Filter by task IDs, task IDs are OR combined |

| Код | Описание |
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

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `timeEntry` | path | string | да | The time entry ID |

| Код | Описание |
|-----|----------|
| `204` | No content |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

#### `PUT` `/v1/organizations/{organization}/time-entries/{timeEntry}`

**Update time entry** — `updateTimeEntry`

| Параметр | In | Тип | Обяз. | Описание |
|---|---|---|---|---|
| `organization` | path | string | да | The organization ID |
| `timeEntry` | path | string | да | The time entry ID |

**Тело запроса:** `TimeEntryUpdateRequest {member_id: string, project_id: string|null, task_id: string|null, start: string, end: string|null, billable: boolean, description: string|null, tags: array|null}`

| Код | Описание |
|-----|----------|
| `200` | `TimeEntryResource` |
| `400` | API exception |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |
| `422` | Validation error |

---

### Пользователь

#### `GET` `/v1/users/me`

**Get the current user** — `getMe`

This endpoint is independent of organization.

| Код | Описание |
|-----|----------|
| `200` | `UserResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |

---

### Членство пользователя

#### `GET` `/v1/users/me/memberships`

**Get the memberships of the current user** — `getMyMemberships`

This endpoint is independent of organization.

| Код | Описание |
|-----|----------|
| `200` | `PersonalMembershipCollection` |
| `401` | Unauthenticated |
| `403` | Authorization error |

---

### Записи времени пользователя

#### `GET` `/v1/users/me/time-entries/active`

**Get the active time entry of the current user** — `getMyActiveTimeEntry`

This endpoint is independent of organization.

| Код | Описание |
|-----|----------|
| `200` | `TimeEntryResource` |
| `401` | Unauthenticated |
| `403` | Authorization error |
| `404` | Not found |

---

## Обработка ошибок

| HTTP | Значение | Действие плагина |
|------|----------|------------------|
| `401` | Не авторизован | Токен невалиден → `/solidtime connect` |
| `403` | Нет прав | Ephemeral: «Недостаточно прав в Solidtime» |
| `404` | Не найдено | Логировать; понятная ошибка |
| `422` | Validation error | Показать errors из тела ответа |
| `5xx` | Server error | «Solidtime server unavailable» |

Типичные ошибки API (из OpenAPI): `AuthenticationException`, `AuthorizationException`, `ValidationException`, `ModelNotFoundException`, `OverlappingTimeEntryApiException`, `EntityStillInUseApiException`.

---

## Проксирование в плагине

```
Webapp  →  /plugins/{plugin_id}/api/v1/...
Server  →  {SolidtimeServerURL}/api/v1/organizations/{org_id}/...
```

Преимущества: токен не покидает сервер; единая точка логирования; возможность кэширования (проекты, клиенты).
