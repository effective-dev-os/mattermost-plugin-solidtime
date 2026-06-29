# Документация Mattermost Solidtime Plugin

## Содержание

1. **[Спецификация](SPECIFICATION.md)** — полное описание функциональных требований, критерии приёмки, план хранения данных
2. **[Архитектура](ARCHITECTURE.md)** — структура проекта, потоки данных, серверные и клиентские компоненты
3. **[UI](UI.md)** — детальная спецификация интерфейса RHS, формы, списка записей
4. **[Solidtime API](SOLIDTIME_API.md)** — полный справочник API (68 эндпоинтов), модели данных, маппинг полей плагина; OpenAPI: [solidtime-openapi.json](solidtime-openapi.json)
5. **[Разработка](DEVELOPMENT.md)** — сборка, деплой, тестирование, соглашения по коду
6. **[Референсные плагины](REFERENCE_PLUGINS.md)** — наши Mattermost-плагины как примеры кода
7. **[Mattermost Plugin Docs](mattermost/README.md)** — локальная копия официальной документации Mattermost

## Порядок чтения

| Роль | Рекомендуемый порядок |
|------|----------------------|
| Новый разработчик | README → SPECIFICATION → ARCHITECTURE → DEVELOPMENT |
| Frontend | SPECIFICATION → UI → SOLIDTIME_API |
| Backend | SPECIFICATION → ARCHITECTURE → SOLIDTIME_API |
| AI-агент (Cursor) | `.cursor/rules/` → SPECIFICATION → REFERENCE_PLUGINS |

## Поддержание актуальности

Документация — контракт проекта. При каждом изменении функциональности обновляй соответствующие файлы. См. `.cursor/rules/documentation.mdc`.
