# Mattermost Solidtime Plugin

Плагин Mattermost для интеграции с [Solidtime](https://www.solidtime.io/) — open-source таймтрекером для фрилансеров и агентств. Позволяет отслеживать время, управлять задачами и проектами прямо из интерфейса Mattermost.

## Возможности

- **Настройки плагина** — URL сервера Solidtime (self-hosted или cloud)
- **Slash-команда `/solidtime`** — подключение и отключение аккаунта пользователя
- **Кнопка в заголовке канала** — быстрый доступ к таймтрекеру (видна только после подключения)
- **Правая боковая панель (RHS)** — форма добавления записи времени и список затреканных задач

## Документация

| Документ | Описание |
|----------|----------|
| [Спецификация](docs/SPECIFICATION.md) | Полное описание функциональных требований |
| [Архитектура](docs/ARCHITECTURE.md) | Техническая архитектура плагина |
| [UI](docs/UI.md) | Спецификация пользовательского интерфейса |
| [Solidtime API](docs/SOLIDTIME_API.md) | Интеграция с API Solidtime |
| [Разработка](docs/DEVELOPMENT.md) | Сборка, деплой и локальная разработка |
| [Референсные плагины](docs/REFERENCE_PLUGINS.md) | Наши Mattermost-плагины как примеры реализации |
| [Mattermost Plugin Docs](docs/mattermost/README.md) | Официальная документация Mattermost (локальная копия) |

## Быстрый старт

```bash
# Установить зависимости Node (см. .nvmrc)
nvm install && nvm use

# Собрать плагин
make

# Результат: dist/com.mattermost.solidtime-*.tar.gz
```

Подробнее — в [руководстве по разработке](docs/DEVELOPMENT.md).

## Статус проекта

Реализован MVP согласно [спецификации](docs/SPECIFICATION.md): connect/disconnect, Channel Header, RHS с формой, списком записей, inline-редактированием и навигацией по неделям.

## Ссылки

- [Solidtime](https://www.solidtime.io/)
- [Документация Solidtime API](https://docs.solidtime.io/api-reference)
- [Mattermost Plugin Development](https://developers.mattermost.com/extend/plugins/)
