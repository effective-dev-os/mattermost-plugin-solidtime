# General Plugin Best Practices

> **Source:** [developers.mattermost.com/integrate/plugins/best-practices](https://developers.mattermost.com/integrate/plugins/best-practices/)

## System Console Configuration

1. Define settings in `plugin.json` → `settings_schema`
2. Server reads them via `LoadPluginConfiguration` / `getConfiguration`
3. Types: `text`, `bool`, `dropdown`, `number`, `custom`

### Solidtime Plugin

```json
{
  "key": "SolidtimeServerURL",
  "type": "text",
  "display_name": "Solidtime Server URL"
}
```

## Custom Settings (type: custom)

1. `"type": "custom"` in manifest
2. `registerAdminConsoleCustomSetting(key, component)` in webapp
3. Component receives props: `id`, `label`, `helpText`, `value`, `onChange`, `setSaveNeeded`, `registerSaveAction`

Reference: `mattermost-plugin-agents` → `registerAdminConsoleCustomSetting('Config', Config)`

## Code Review: PR from starter template

To review the entire codebase after forking the starter template:
1. Find your first commit: `git log --oneline`
2. `git branch base <first-commit>~1`
3. `git branch compare master`
4. PR: base → compare

## API Design

Accept an options struct instead of a long parameter list — this makes extending the API easier.

## Metrics (v9.4+)

`ServeMetrics` hook → `http://SITE_URL:8067/plugins/PLUGIN_ID/metrics` (Prometheus format).

## Related documents

- [Server Best Practices](server-best-practices.md)
- [Webapp Best Practices](webapp-best-practices.md)
- [High Availability](server-ha.md)
