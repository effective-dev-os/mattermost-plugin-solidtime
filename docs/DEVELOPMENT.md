# Development guide

## Requirements

- Go 1.25+
- Node.js 16+ and npm 8+ (see `.nvmrc`)
- Mattermost Server 6.2.1+ with plugin uploads enabled
- A Solidtime instance (cloud or self-hosted) with an API token for testing

## Initial setup

```bash
# Node
nvm install && nvm use

# Webapp dependencies
cd webapp && npm install && cd ..

# Build
make
```

If `go build` fails on `goxmldsig` (VCS fetch), use:

```bash
GOVCS='github.com/russellhaaring/goxmldsig:off' make
```

Artifact: `dist/dev.effective.solidtime-*.tar.gz`

> **Note:** Go module path remains `github.com/mattermost/mattermost-plugin-starter-template` (template legacy); plugin ID in `plugin.json` is `dev.effective.solidtime`.

## Local deploy

### Local Mode (recommended)

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

### Watch mode (auto-rebuild webapp)

```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_TOKEN=<your-admin-token>
make watch
```

### Deploy with credentials

```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_USERNAME=admin
export MM_ADMIN_PASSWORD=password
make deploy
```

## Build commands

| Command | Action |
|---------|--------|
| `make` | Full build server + webapp → `dist/*.tar.gz` |
| `make server` | Go server only |
| `make webapp` | React bundle only |
| `make deploy` | Build + upload to Mattermost |
| `make watch` | Watch webapp + auto deploy |
| `make test` | Run server and webapp tests |
| `make i18n-extract` | Extract webapp strings into `webapp/src/i18n/en.json` |

## Localization (webapp)

Strings use `react-intl` (`formatMessage`, `FormattedMessage`) with semantic IDs (`solidtime.*`).

| File | Purpose |
|------|---------|
| `webapp/src/i18n/en.json` | English catalog (generated + manual keys) |
| `webapp/src/i18n/ru.json` | Russian catalog (translate values; keep keys identical) |
| `webapp/src/i18n/helpers.ts` | `resolveLocale`, `translate` for non-React registration APIs |
| `webapp/src/i18n/messages.ts` | Shared error message descriptors |

### Adding or changing strings

1. Wrap the string in `formatMessage` / `FormattedMessage` with `id` and English `defaultMessage`.
2. Run `make i18n-extract` (runs `npm run i18n-extract` in `webapp/`; source globs are defined in `webapp/package.json`).
3. Update `webapp/src/i18n/ru.json` with the Russian translation for any new/changed keys.
4. Keys used only via `translate()` in `index.tsx` (e.g. channel header tooltip) must be added manually to both JSON files.

Source paths scanned by extract: `src/index.tsx`, `src/i18n/messages.ts`, `src/api/errors.ts`, `src/components/**/*.{ts,tsx}`.

`i18n-extract` overwrites `en.json`. Keys not picked up by formatjs (error descriptors in `messages.ts`, `translate()` in `index.tsx`) must remain in `en.json` manually — compare with `ru.json` after each extract.

`react-intl` is provided by Mattermost at runtime (`ReactIntl` webpack external). It is listed in `devDependencies` for TypeScript only — do not import it in a way that bundles it into `main.js`.

## Testing

### Server (Go)

```bash
cd server && go test ./...
```

### Webapp (Jest)

```bash
cd webapp && npm test
```

### Manual testing

1. Upload the plugin **without** Solidtime Server URL — confirm the plugin does not activate.
2. Set Solidtime Server URL in System Console, enable the plugin.
3. Open RHS via the Solidtime button in the channel header.
4. Connect via the RHS screen or `/solidtime connect <token>`.
5. Create a time entry.
6. Run `/solidtime disconnect` — RHS shows the connect screen; header button remains.

## Coding conventions

### Go (server)

- Minimal packages; new package only for external integration (`solidtime/`) or storage (`store/`).
- Wrap errors with `github.com/pkg/errors`.
- HTTP handlers in `api.go`; business logic in separate files/packages.
- Tests alongside code (`*_test.go`).

### TypeScript (webapp)

- Functional React components.
- Solidtime types — `webapp/src/types/solidtime.ts`.
- Plugin API client — `webapp/src/api/client.ts`.
- Styles: CSS Modules or inline styles aligned with Mattermost theme variables.

## Updating documentation

When adding a new feature **always** update:

1. [SPECIFICATION.md](SPECIFICATION.md) — functional requirements and acceptance criteria
2. [ARCHITECTURE.md](ARCHITECTURE.md) — when architecture changes
3. [UI.md](UI.md) — when the interface changes
4. [SOLIDTIME_API.md](SOLIDTIME_API.md) — when new API integrations are added
5. [README.md](../README.md) — when overview features change

See Cursor rules (`.cursor/rules/documentation.mdc`).

## Reference plugins

Before implementing a Mattermost feature, study the matching pattern in our plugins. Full feature → file matrix — [REFERENCE_PLUGINS.md](REFERENCE_PLUGINS.md).

| Plugin | Path | Key patterns |
|--------|------|--------------|
| yandex-calendar | `../mattermost-plugin-yandex-calendar` | connect/disconnect, KV Store, jobs |
| food-ordering | `../com.effective.food-ordering` | Channel Header show/hide, WebSocket, API client |
| scheduled-messages | `../mattermost-plugin-scheduled-messages` | WebSocket events, root component |
| agents | `../mattermost-plugin-agents` | RHS + Channel Header, Redux |

Also see open-source plugins on GitHub: [mattermost-plugin-demo](https://github.com/mattermost/mattermost-plugin-demo), [mattermost-plugin-github](https://github.com/mattermost/mattermost-plugin-github).

## Mattermost documentation

Local copy in [mattermost/](mattermost/README.md):
- SDK Reference (webapp + server)
- Hello World, Redux actions, best practices, HA, developer workflow

Online: [Webapp SDK](https://developers.mattermost.com/integrate/reference/webapp/webapp-reference/), [Server SDK](https://developers.mattermost.com/integrate/reference/server/server-reference/).

## Useful links

- [Solidtime API Reference](https://docs.solidtime.io/api-reference)
- [Solidtime API Access Guide](https://docs.solidtime.io/user-guide/access-api)
