# General Plugin Best Practices

> **Источник:** [developers.mattermost.com/integrate/plugins/best-practices](https://developers.mattermost.com/integrate/plugins/best-practices/)

## System Console Configuration

1. Определи настройки в `plugin.json` → `settings_schema`
2. Server читает через `LoadPluginConfiguration` / `getConfiguration`
3. Типы: `text`, `bool`, `dropdown`, `number`, `custom`

### Solidtime Plugin

```json
{
  "key": "SolidtimeServerURL",
  "type": "text",
  "display_name": "Solidtime Server URL"
}
```

## Custom Settings (type: custom)

1. `"type": "custom"` в manifest
2. `registerAdminConsoleCustomSetting(key, component)` в webapp
3. Component получает props: `id`, `label`, `helpText`, `value`, `onChange`, `setSaveNeeded`, `registerSaveAction`

Референс: `mattermost-plugin-agents` → `registerAdminConsoleCustomSetting('Config', Config)`

## Code Review: PR из starter template

Для review всей кодовой базы после форка starter template:
1. Найди первый свой commit: `git log --oneline`
2. `git branch base <first-commit>~1`
3. `git branch compare master`
4. PR: base → compare

## API Design

Принимай options struct вместо длинного списка параметров — упрощает расширение API.

## Metrics (v9.4+)

`ServeMetrics` hook → `http://SITE_URL:8067/plugins/PLUGIN_ID/metrics` (Prometheus format).

## Связанные документы

- [Server Best Practices](server-best-practices.md)
- [Webapp Best Practices](webapp-best-practices.md)
- [High Availability](server-ha.md)
