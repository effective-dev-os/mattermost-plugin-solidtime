# Референсные плагины Mattermost

При реализации функциональности Solidtime Plugin **в первую очередь** смотри на код наших существующих плагинов — они отражают принятые в команде паттерны, соглашения и проверенные решения. Дополнительно изучай open-source плагины на [GitHub (mattermost)](https://github.com/mattermost) и в [Mattermost Marketplace](https://mattermost.com/marketplace/).

## Внутренние референсы (Effective)

### 1. mattermost-plugin-yandex-calendar

**Путь:** `/Users/danil/Documents/Work/Effective/Mattermost/mattermost-plugin-yandex-calendar`

**Когда смотреть:** OAuth/connect/disconnect, slash-команды, KV Store, фоновые jobs, i18n, слоистая архитектура server.

| Паттерн | Где смотреть |
|---------|--------------|
| `/command connect` и `/disconnect` | `calendar/command/command.go`, `calendar/command/connect.go`, `calendar/command/disconnect.go` |
| Autocomplete slash-команд | `calendar/command/command.go` → `GetAutocompleteData` |
| Хранение пользовательских credentials | `calendar/store/` (encrypted KV, TTL, cache) |
| HTTP API + middleware | `calendar/api/api.go` |
| Фоновые задачи (cluster jobs) | `calendar/jobs/`, `calendar/engine/poll_notifications.go` |
| Engine-слой (бизнес-логика) | `calendar/engine/` |
| i18n (ru/en) | `assets/i18n/`, `.cursor/rules/i18n-localization-always.mdc` |
| System Console settings | `plugin.json` → `settings_schema` |
| Cursor rules (архитектура) | `.cursor/rules/project-architecture-patterns.mdc` |

**Релевантность для Solidtime:** наиболее близкий аналог по флоу `connect` / `disconnect` и per-user хранению токенов.

---

### 2. com.effective.food-ordering

**Путь:** `/Users/danil/Documents/Work/Effective/Mattermost/com.effective.food-ordering`

**Когда смотреть:** условная видимость Channel Header Button, WebSocket-события, API-клиент webapp, custom routes.

| Паттерн | Где смотреть |
|---------|--------------|
| Channel Header Button (show/hide) | `webapp/src/index.ts` → `switchStatus()` |
| `unregisterComponent` при скрытии кнопки | `webapp/src/index.ts` |
| WebSocket → обновление UI | `registerWebSocketEventHandler` + `switchStatus` |
| Проверка статуса при инициализации | `getRequest('/food-ordering-status')` |
| API-клиент плагина (fetch + CSRF) | `webapp/src/client.ts` |
| Custom route (отдельная страница) | `registerCustomRoute('/food-list', FoodList)` |
| Redux reducer плагина | `webapp/src/reducer.ts`, `registerReducer` |
| Custom post type | `registerPostTypeComponent` |
| Server API + KV | `server/api.go`, `server/kvstore.go` |
| Cron jobs | `server/cron.go` |

**Релевантность для Solidtime:** **ключевой референс** для паттерна «кнопка в channel header видна только после connect» через `register` / `unregisterComponent` + WebSocket/API.

---

### 3. mattermost-plugin-scheduled-messages

**Путь:** `/Users/danil/Documents/Work/Effective/Mattermost/mattermost-plugin-scheduled-messages`

**Когда смотреть:** инъекция в UI Mattermost, WebSocket-события, root component hooks.

| Паттерн | Где смотреть |
|---------|--------------|
| Root component (глобальный hook) | `webapp/src/index.ts` → `registerRootComponent(Hook)` |
| WebSocket custom events | `webapp/src/websocket-events.ts` |
| DOM injection | `webapp/src/injection.ts` |
| Post editor integration | `webapp/src/components/Hook/` (закомментирован `registerPostEditorActionComponent`) |

**Релевантность для Solidtime:** WebSocket-уведомления webapp после server-side действий (например, после `/solidtime connect`).

---

### 4. mattermost-plugin-agents (Effective AI)

**Путь:** `/Users/danil/Documents/Work/Effective/Mattermost/mattermost-plugin-agents`

**Когда смотреть:** RHS sidebar, Channel Header Button + RHS toggle, Redux, API client, i18n.

| Паттерн | Где смотреть |
|---------|--------------|
| `registerRightHandSidebarComponent` | `webapp/src/index.tsx` |
| Channel Header → `toggleRHSPlugin` | `registerChannelHeaderButtonAction` + `rhs.toggleRHSPlugin` |
| Условный рендер иконки в header | `ChannelHeaderIcon` (проверка доступа) |
| Redux setup | `webapp/src/redux.ts`, `setupRedux` |
| API client с SiteURL | `webapp/src/client.ts` → `setSiteURL` |
| Custom admin setting | `registerAdminConsoleCustomSetting` |
| Slash command hooks (webapp) | `registerSlashCommandWillBePostedHook` |
| WebSocket handlers | `registerWebSocketEventHandler` |
| i18n | `registerTranslations` |

**Релевантность для Solidtime:** **ключевой референс** для связки Channel Header Button + RHS sidebar.

---

## Матрица: фича Solidtime → референс

| Фича Solidtime | Основной референс | Дополнительно |
|----------------|-------------------|---------------|
| `/solidtime connect/disconnect` | yandex-calendar | — |
| Channel Header Button (условная видимость) | food-ordering | agents |
| RHS sidebar | agents | — |
| API proxy (server → Solidtime) | yandex-calendar (`remote/`) | food-ordering (`server/api.go`) |
| KV Store (токены per user) | yandex-calendar (`store/`) | food-ordering (`kvstore.go`) |
| Webapp API client | food-ordering (`client.ts`) | agents (`client.ts`) |
| WebSocket → обновление UI | food-ordering | scheduled-messages |
| System Console settings | yandex-calendar (`plugin.json`) | agents (custom setting) |
| Пагинация / списки в UI | — | agents (RHS components) |

## Внешние референсы (GitHub)

Полезные официальные и community-плагины:

| Плагин | Что изучать |
|--------|-------------|
| [mattermost-plugin-starter-template](https://github.com/mattermost/mattermost-plugin-starter-template) | Базовая структура, Makefile, CI |
| [mattermost-plugin-demo](https://github.com/mattermost/mattermost-plugin-demo) | Все registry-методы, примеры UI |
| [mattermost-plugin-github](https://github.com/mattermost/mattermost-plugin-github) | Channel header, sidebar, OAuth |
| [mattermost-plugin-jira](https://github.com/mattermost/mattermost-plugin-jira) | Slash commands, post actions |
| [mattermost-plugin-zoom](https://github.com/mattermost/mattermost-plugin-zoom) | Channel header button |

## Как использовать референсы

1. Определи фичу в [SPECIFICATION.md](SPECIFICATION.md).
2. Найди строку в матрице выше.
3. Открой указанный файл в референсном плагине.
4. Адаптируй паттерн под Solidtime (не копируй слепо — учитывай различия API).
5. При появлении нового устойчивого паттерна — обнови этот документ.
