# Developer Workflow

> **Источник:** [developers.mattermost.com/integrate/plugins/developer-workflow](https://developers.mattermost.com/integrate/plugins/developer-workflow/)

## Make-команды

| Команда | Описание |
|---------|----------|
| `make test` | Server + webapp тесты |
| `make check-style` | Линтинг server и webapp |
| `make deploy` | Сборка + деплой на Mattermost (нужен Local Mode) |
| `make watch` | Watch webapp + auto deploy |
| `make dist` | Сборка `dist/*.tar.gz` |
| `make enable` / `make disable` | Включить/выключить плагин |
| `make reset` | Disable + enable (перезапуск плагина) |
| `make attach-headless` | Delve debugger (port 2346) |
| `make clean` | Очистка build-артефактов |

## Debug build

```bash
MM_DEBUG=1 make deploy
```

## Webapp development

Открывай IDE в папке `webapp/` для корректной работы с `webpack.config.js` и `tsconfig.json`.

## Внешние интеграции (webhooks)

Для локальной разработки с webhooks:
- [ngrok](https://ngrok.com/): `ngrok http 8065`
- [localhost.run](https://localhost.run/): `ssh -R 80:localhost:8065 ssh.localhost.run`

Установи Site URL Mattermost на публичный HTTPS URL.

## Debug server plugin (delve)

1. `PluginSettings.EnableHealthCheck: false` в config.json
2. Patch go-plugin RPC keep-alive (см. оригинальную документацию)
3. VSCode launch.json: attach port 2346
4. `make deploy` → `make attach-headless`

## Troubleshooting

`make reset` — disable/enable plugin + terminate delve processes.

Community: [Developer Toolkit channel](https://community.mattermost.com/core/channels/developer-toolkit)
