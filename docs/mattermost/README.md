# Документация Mattermost Plugin Development

Локальная копия официальной документации Mattermost по разработке плагинов. Используется как справочник при реализации Solidtime Plugin.

> **Источник:** [developers.mattermost.com](https://developers.mattermost.com/integrate/plugins/). При расхождениях приоритет у онлайн-версии.

## SDK Reference (полный справочник API)

| Документ | Описание |
|----------|----------|
| [Webapp SDK Reference](reference/webapp-reference.md) | Все методы `PluginRegistry`, типы, хуки webapp |
| [Server SDK Reference](reference/server-reference.md) | Все хуки server plugin, `pluginapi`, KV Store |

## Руководства (Guides)

| Документ | Описание |
|----------|----------|
| [Webapp Hello World](guides/webapp-hello-world.md) | Быстрый старт webapp, `registerChannelHeaderButtonAction` |
| [Redux Actions](guides/webapp-redux-actions.md) | `mattermost-redux`, selectors, `registerReducer` |
| [Webapp Best Practices](guides/webapp-best-practices.md) | Где размещать UI, SiteURL, CSRF |
| [Server Hello World](guides/server-hello-world.md) | Быстрый старт server plugin, `ServeHTTP` |
| [High Availability](guides/server-ha.md) | Stateless plugins, KV Store, cluster jobs |
| [Server Best Practices](guides/server-best-practices.md) | Аутентификация HTTP, static files |
| [Developer Workflow](guides/developer-workflow.md) | `make` команды, watch, debug с delve |
| [General Best Practices](guides/best-practices.md) | System Console settings, custom settings, metrics |

## Быстрые ссылки (онлайн)

- [Plugin Overview](https://developers.mattermost.com/integrate/plugins/)
- [Webapp SDK Reference](https://developers.mattermost.com/integrate/reference/webapp/webapp-reference/)
- [Server SDK Reference](https://developers.mattermost.com/integrate/reference/server/server-reference/)
- [Manifest Reference](https://developers.mattermost.com/integrate/plugins/manifest-reference/)

## Связанные документы проекта

- [Референсные плагины](../REFERENCE_PLUGINS.md) — наши плагины как примеры кода
- [Архитектура](../ARCHITECTURE.md) — архитектура Solidtime Plugin
- [Разработка](../DEVELOPMENT.md) — сборка и деплой
