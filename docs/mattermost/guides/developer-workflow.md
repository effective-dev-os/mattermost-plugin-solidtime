# Developer Workflow

> **Source:** [developers.mattermost.com/integrate/plugins/developer-workflow](https://developers.mattermost.com/integrate/plugins/developer-workflow/)

## Make commands

| Command | Description |
|---------|----------|
| `make test` | Server + webapp tests |
| `make check-style` | Lint server and webapp |
| `make deploy` | Build + deploy to Mattermost (requires Local Mode) |
| `make watch` | Watch webapp + auto deploy |
| `make dist` | Build `dist/*.tar.gz` |
| `make enable` / `make disable` | Enable/disable plugin |
| `make reset` | Disable + enable (restart plugin) |
| `make attach-headless` | Delve debugger (port 2346) |
| `make clean` | Clean build artifacts |

## Debug build

```bash
MM_DEBUG=1 make deploy
```

## Webapp development

Open your IDE in the `webapp/` folder for correct handling of `webpack.config.js` and `tsconfig.json`.

## External integrations (webhooks)

For local development with webhooks:
- [ngrok](https://ngrok.com/): `ngrok http 8065`
- [localhost.run](https://localhost.run/): `ssh -R 80:localhost:8065 ssh.localhost.run`

Set the Mattermost Site URL to a public HTTPS URL.

## Debug server plugin (delve)

1. `PluginSettings.EnableHealthCheck: false` in config.json
2. Patch go-plugin RPC keep-alive (see original documentation)
3. VSCode launch.json: attach port 2346
4. `make deploy` → `make attach-headless`

## Troubleshooting

`make reset` — disable/enable plugin + terminate delve processes.

Community: [Developer Toolkit channel](https://community.mattermost.com/core/channels/developer-toolkit)
