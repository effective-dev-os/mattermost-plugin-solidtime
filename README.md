# Mattermost Solidtime Plugin

Плагин Mattermost для интеграции с [Solidtime](https://www.solidtime.io/) — open-source таймтрекером для фрилансеров и агентств. Позволяет отслеживать время, управлять задачами и проектами прямо из интерфейса Mattermost.

## Возможности

- **Настройки плагина** — URL сервера Solidtime (self-hosted или cloud)
- **Slash-команда `/solidtime`** — подключение и отключение аккаунта пользователя
- **Кнопка в заголовке канала** — видна при настроенном URL сервера; быстрый доступ к таймтрекеру; при активном таймере — виджет STOP + тикающее время
- **Правая боковая панель (RHS)** — подключение через UI или slash-команду; форма добавления записи, список по дням, навигация по неделям
- **Multi-org** — селектор организации в RHS (если у пользователя несколько org)
- **Inline-редактирование и удаление** записей времени
- **Избранные проекты (☆)** — локально в браузере
- **Running timer** — Manual / Timer mode в форме; START/STOP синхронизируется с Channel Header

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

# Результат: dist/dev.effective.solidtime-*.tar.gz
```

Подробнее — в [руководстве по разработке](docs/DEVELOPMENT.md).

## Статус проекта

Реализованы MVP и Фаза 2 согласно [спецификации](docs/SPECIFICATION.md): connect/disconnect, Channel Header (с виджетом таймера), RHS с multi-org, созданием/редактированием/удалением записей, избранным, server-side пагинацией записей за неделю и running timer (Manual/Timer mode).

## Ссылки

- [Solidtime](https://www.solidtime.io/)
- [Документация Solidtime API](https://docs.solidtime.io/api-reference)
- [Mattermost Plugin Development](https://developers.mattermost.com/extend/plugins/)
