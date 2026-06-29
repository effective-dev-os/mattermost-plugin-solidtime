# Руководство по разработке

## Требования

- Go 1.25+
- Node.js 16+ и npm 8+ (см. `.nvmrc`)
- Mattermost Server 6.2.1+ с включёнными plugin uploads
- Инстанс Solidtime (cloud или self-hosted) с API-токеном для тестирования

## Первоначальная настройка

```bash
# Node
nvm install && nvm use

# Зависимости webapp
cd webapp && npm install && cd ..

# Сборка
make
```

Артефакт: `dist/com.mattermost.plugin-starter-template.tar.gz`

> **TODO:** обновить plugin ID с `com.mattermost.plugin-starter-template` на `com.mattermost.solidtime` при первом рефакторинге.

## Локальный деплой

### Local Mode (рекомендуется)

```json
{
  "ServiceSettings": {
    "EnableLocalMode": true,
    "LocalModeSocketLocation": "/var/tmp/mattermost_local.socket"
  },
  "PluginSettings": {
    "EnableUploads": true
  }
}
```

```bash
make deploy
```

### Watch mode (автопересборка webapp)

```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_TOKEN=<your-admin-token>
make watch
```

### Деплой с credentials

```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_USERNAME=admin
export MM_ADMIN_PASSWORD=password
make deploy
```

## Структура сборки

| Команда | Действие |
|---------|----------|
| `make` | Полная сборка server + webapp → `dist/*.tar.gz` |
| `make server` | Только Go server |
| `make webapp` | Только React bundle |
| `make deploy` | Сборка + загрузка на Mattermost |
| `make watch` | Watch webapp + auto deploy |
| `make test` | Запуск тестов server и webapp |

## Тестирование

### Server (Go)

```bash
cd server && go test ./...
```

### Webapp (Jest)

```bash
cd webapp && npm test
```

### Ручное тестирование

1. Загрузить плагин, активировать.
2. В System Console указать Solidtime Server URL.
3. Выполнить `/solidtime connect <token>`.
4. Убедиться, что кнопка появилась в channel header.
5. Открыть RHS, создать time entry.
6. Выполнить `/solidtime disconnect`, убедиться что кнопка скрыта.

## Соглашения по коду

### Go (server)

- Минимум пакетов; новый пакет — только для внешней интеграции (`solidtime/`) или хранилища (`store/`).
- Ошибки оборачивать через `github.com/pkg/errors`.
- HTTP-хендлеры в `api.go`, бизнес-логика — в отдельных файлах/пакетах.
- Тесты рядом с кодом (`*_test.go`).

### TypeScript (webapp)

- Функциональные React-компоненты.
- Типы Solidtime — в `webapp/src/types/solidtime.ts`.
- API-клиент плагина — в `webapp/src/api/client.ts`.
- Стили: CSS Modules или inline styles, согласованные с Mattermost theme variables.

## Обновление документации

При добавлении новой фичи **обязательно** обновить:

1. [SPECIFICATION.md](SPECIFICATION.md) — функциональные требования и критерии приёмки
2. [ARCHITECTURE.md](ARCHITECTURE.md) — при изменении архитектуры
3. [UI.md](UI.md) — при изменении интерфейса
4. [SOLIDTIME_API.md](SOLIDTIME_API.md) — при новых API-интеграциях
5. [README.md](../README.md) — при изменении обзорных возможностей

Подробнее — в Cursor rules (`.cursor/rules/documentation.mdc`).

## Референсные плагины

Перед реализацией фичи Mattermost изучи соответствующий паттерн в наших плагинах. Подробная матрица «фича → файл» — в [REFERENCE_PLUGINS.md](REFERENCE_PLUGINS.md).

| Плагин | Путь | Ключевые паттерны |
|--------|------|-------------------|
| yandex-calendar | `../mattermost-plugin-yandex-calendar` | connect/disconnect, KV Store, jobs |
| food-ordering | `../com.effective.food-ordering` | Channel Header show/hide, WebSocket, API client |
| scheduled-messages | `../mattermost-plugin-scheduled-messages` | WebSocket events, root component |
| agents | `../mattermost-plugin-agents` | RHS + Channel Header, Redux |

Также смотри open-source плагины на GitHub: [mattermost-plugin-demo](https://github.com/mattermost/mattermost-plugin-demo), [mattermost-plugin-github](https://github.com/mattermost/mattermost-plugin-github).

## Документация Mattermost

Локальная копия в [mattermost/](mattermost/README.md):
- SDK Reference (webapp + server)
- Hello World, Redux actions, best practices, HA, developer workflow

Онлайн-версии: [Webapp SDK](https://developers.mattermost.com/integrate/reference/webapp/webapp-reference/), [Server SDK](https://developers.mattermost.com/integrate/reference/server/server-reference/).

## Полезные ссылки

- [Solidtime API Reference](https://docs.solidtime.io/api-reference)
- [Solidtime API Access Guide](https://docs.solidtime.io/user-guide/access-api)
