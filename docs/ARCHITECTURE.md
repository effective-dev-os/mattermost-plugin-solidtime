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
│  │  • Slash commands   │    │  • Channel Header Button  │  │
│  │  • HTTP API proxy   │◄──►│  • RHS Sidebar            │  │
│  │  • KV Store         │    │  • Redux (опционально)    │  │
│  │  • Config           │    │                           │  │
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
├── plugin.json              # Манифест плагина (id, settings_schema, executables)
├── server/
│   ├── main.go              # Точка входа
│   ├── plugin.go            # Основная структура Plugin, хуки OnActivate/OnDeactivate
│   ├── configuration.go     # Конфигурация плагина (SolidtimeServerURL)
│   ├── api.go               # HTTP-роутер и middleware авторизации
│   ├── command/
│   │   └── command.go       # Обработка /solidtime
│   ├── solidtime/
│   │   └── client.go        # HTTP-клиент Solidtime API (создать)
│   └── store/
│       └── kvstore/         # Обёртка KV Store для токенов пользователей
├── webapp/
│   └── src/
│       ├── index.tsx         # Точка входа, регистрация плагина
│       ├── components/
│       │   ├── rhs/          # RHS sidebar (создать)
│       │   │   ├── sidebar.tsx
│       │   │   ├── time_entry_form.tsx
│       │   │   ├── time_entry_list.tsx
│       │   │   └── pagination_footer.tsx
│       │   └── channel_header_button.tsx
│       ├── api/
│       │   └── client.ts     # Клиент API плагина (создать)
│       └── types/
│           └── solidtime.ts  # TypeScript-типы (создать)
├── assets/
│   └── solidtime-icon.svg    # Иконка для Channel Header (создать)
└── docs/                     # Документация проекта
```

## Серверная часть (Go)

### Жизненный цикл

1. **OnActivate** — инициализация KV Store, регистрация slash-команды, HTTP-роутера.
2. **OnConfigurationChange** — загрузка `SolidtimeServerURL` из конфигурации.
3. **ExecuteCommand** — делегирование в `command.Handler`.
4. **ServeHTTP** — проксирование API-запросов от webapp к Solidtime.

### Пакеты

| Пакет | Ответственность |
|-------|-----------------|
| `main` | Хуки плагина, конфигурация, роутинг |
| `command` | Slash-команды `/solidtime connect`, `/solidtime disconnect` |
| `solidtime` | HTTP-клиент для Solidtime REST API |
| `store/kvstore` | Хранение токенов и кэша (org_id, member_id) per user |

### Авторизация API

Middleware `MattermostAuthorizationRequired` проверяет заголовок `Mattermost-User-ID`. Для каждого запроса сервер:

1. Получает `userID` из заголовка.
2. Загружает токен Solidtime из KV Store.
3. Если токен отсутствует — возвращает `401`.
4. Выполняет запрос к Solidtime с `Authorization: Bearer <token>`.

## Клиентская часть (React/TypeScript)

### Регистрация компонентов

В `webapp/src/index.tsx` при `initialize`:

```typescript
// 1. RHS
const { showRHSPlugin } = registry.registerRightHandSidebarComponent(
    RHSSidebar,
    'Solidtime',
);

// 2. Channel Header Button (условная видимость)
registry.registerChannelHeaderButtonAction(
    <SolidtimeIcon />,
    () => store.dispatch(showRHSPlugin),
    'Solidtime',
    'Open Solidtime Time Tracker',
);
```

### Управление состоянием

Рекомендуемый подход:

- **Статус подключения** — запрос `GET /api/v1/connection/status` при инициализации.
- **Данные RHS** — локальный state в компонентах или Redux reducer (`registerReducer`).
- **Кэш проектов** — в памяти на время сессии RHS.

### Поток данных при создании записи

```
User fills form → POST /plugins/{id}/api/v1/time-entries
    → Server adds Bearer token
    → POST {SolidtimeServerURL}/api/v1/organizations/{org_id}/time-entries
    → Response → Webapp refreshes list
```

### Поток данных при обновлении записи

```
User edits entry field (blur / value change)
    → PUT /plugins/{id}/api/v1/time-entries/{id}
    → Server adds Bearer token
    → PUT {SolidtimeServerURL}/api/v1/organizations/{org_id}/time-entries/{id}
    → Response → Webapp updates entry, week total, day grouping
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
