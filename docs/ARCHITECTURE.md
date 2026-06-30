# Архитектура

## Обзор

Плагин состоит из двух частей, стандартных для Mattermost:

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
             │ HTTPS (Bearer token из KV Store)
             ▼
┌────────────────────────┐
│   Solidtime Server     │
│   REST API v1          │
└────────────────────────┘
```

Webapp **никогда** не обращается к Solidtime напрямую. Все запросы идут через серверную часть плагина, которая подставляет токен пользователя.

## Структура каталогов

```
mattermost-plugin-solidtime/
├── plugin.json
├── server/
│   ├── main.go
│   ├── plugin.go
│   ├── configuration.go
│   ├── api.go               # HTTP-роутер, proxy handlers
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
│       └── favorites.ts     # localStorage избранных проектов
└── docs/
```

## Серверная часть (Go)

### Пакеты

| Пакет | Ответственность |
|-------|-----------------|
| `main` | Хуки плагина, конфигурация, роутинг |
| `command` | Slash-команды `/solidtime connect`, `/solidtime disconnect` |
| `connection` | Connect/disconnect, org list/switch, WS events |
| `solidtime` | HTTP-клиент Solidtime REST API |
| `store/kvstore` | Токены, выбранная org/member, memberships cache |

### KV Store (per user)

| Ключ | Содержимое |
|------|------------|
| `solidtime_token_{userID}` | API token |
| `solidtime_org_{userID}` | Выбранная organization ID |
| `solidtime_member_{userID}` | Member ID для выбранной org |
| `solidtime_memberships_{userID}` | JSON-массив `{org_id, member_id, org_name}` |

При connect: memberships кэшируются из `GET /users/me/memberships`; выбранная org = прежняя, если ещё в списке, иначе первая.

### WebSocket-события

Публикуются через `connection.Service` → `PublishWebSocketEvent`:

| Событие | Триггер |
|---------|---------|
| `solidtime-connection-change` | connect / disconnect |
| `solidtime-org-change` | `PUT /organizations/current` |
| `solidtime-timer-change` | create с `end:null`, stop, delete active entry |

Payload таймера: `active` как `map[string]any` (JSON round-trip), не struct — иначе gob-RPC плагина падает.

Webapp подписывается на `custom_{pluginId}_{event}`.

### Авторизация API

Middleware `MattermostAuthorizationRequired` проверяет заголовок `Mattermost-User-ID`. Для каждого запроса сервер:

1. Получает `userID` из заголовка.
2. Загружает токен Solidtime из KV Store.
3. Если токен отсутствует — возвращает `401`.
4. Разрешает `org_id` / `member_id` из KV (без silent fallback на первую org).
5. Выполняет запрос к Solidtime с `Authorization: Bearer <token>`.

### Пагинация time entries

`GetTimeEntries` handler вызывает `GetAllTimeEntries` — обход до 5 страниц по 100 записей (потолок 500) за диапазон `start`/`end`.

## Клиентская часть (React/TypeScript)

### Регистрация

```typescript
registry.registerReducer(reducer);
registry.registerRightHandSidebarComponent(RHSSidebar, 'Solidtime');
registry.registerChannelHeaderButtonAction(
    <HeaderButton />,  // channel_header_timer — иконка или виджет
    () => store.dispatch(toggleRHSPlugin),
    'Solidtime',
    'Toggle Solidtime Time Tracker',
);
```

### Управление состоянием

| Состояние | Где |
|-----------|-----|
| connect/disconnect | `connection_state.ts` (cached flag + WS subscribers) |
| `activeTimer`, `entryMode`, `selectedOrgId` | Redux (`reducer.ts`) |
| RHS data (projects, entries) | local state в `sidebar.tsx` |
| favorite project IDs | `localStorage` (`utils/favorites.ts`) |

### Потоки данных

**Смена org:**
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

**Удаление записи:**
```
time_entry_card ×→OK → DELETE /time-entries/{id}
    → list refresh; if was active → timer WS
```

## Конфигурация (`plugin.json`)

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

## Референсы при реализации

Перед написанием кода изучи аналогичные паттерны в наших плагинах — см. [REFERENCE_PLUGINS.md](REFERENCE_PLUGINS.md). Официальная документация Mattermost — в [mattermost/](mattermost/README.md).

## Зависимости

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Server | Go | 1.25+ |
| Webapp | React, TypeScript | Node 16+ (см. `.nvmrc`) |
| Mattermost | plugin API | min_server_version 6.2.1 |
| HTTP router | gorilla/mux | — |

## Безопасность

- API-токены Solidtime хранятся в KV Store Mattermost, доступны только серверной части плагина.
- Все API-эндпоинты плагина требуют авторизации Mattermost.
- Токен передаётся в slash-команде один раз и не логируется.
- HTTPS обязателен для production-инстансов Solidtime.
