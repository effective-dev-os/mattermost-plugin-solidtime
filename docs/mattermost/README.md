# Mattermost Plugin Development Documentation

Local copy of the official Mattermost plugin development documentation. Used as a reference when implementing the Solidtime Plugin.

> **Source:** [developers.mattermost.com](https://developers.mattermost.com/integrate/plugins/). If there are discrepancies, the online version takes precedence.

## SDK Reference (complete API reference)

| Document | Description |
|----------|----------|
| [Webapp SDK Reference](reference/webapp-reference.md) | All `PluginRegistry` methods, types, webapp hooks |
| [Server SDK Reference](reference/server-reference.md) | All server plugin hooks, `pluginapi`, KV Store |

## Guides

| Document | Description |
|----------|----------|
| [Webapp Hello World](guides/webapp-hello-world.md) | Webapp quick start, `registerChannelHeaderButtonAction` |
| [Redux Actions](guides/webapp-redux-actions.md) | `mattermost-redux`, selectors, `registerReducer` |
| [Webapp Best Practices](guides/webapp-best-practices.md) | Where to place UI, SiteURL, CSRF |
| [Server Hello World](guides/server-hello-world.md) | Server plugin quick start, `ServeHTTP` |
| [High Availability](guides/server-ha.md) | Stateless plugins, KV Store, cluster jobs |
| [Server Best Practices](guides/server-best-practices.md) | HTTP authentication, static files |
| [Developer Workflow](guides/developer-workflow.md) | `make` commands, watch, debugging with delve |
| [General Best Practices](guides/best-practices.md) | System Console settings, custom settings, metrics |

## Quick links (online)

- [Plugin Overview](https://developers.mattermost.com/integrate/plugins/)
- [Webapp SDK Reference](https://developers.mattermost.com/integrate/reference/webapp/webapp-reference/)
- [Server SDK Reference](https://developers.mattermost.com/integrate/reference/server/server-reference/)
- [Manifest Reference](https://developers.mattermost.com/integrate/plugins/manifest-reference/)

## Related project documents

- [Reference plugins](../REFERENCE_PLUGINS.md) — our plugins as code examples
- [Architecture](../ARCHITECTURE.md) — Solidtime Plugin architecture
- [Development](../DEVELOPMENT.md) — build and deploy
