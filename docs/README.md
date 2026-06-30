# Mattermost Solidtime Plugin Documentation

## Contents

1. **[Specification](SPECIFICATION.md)** — full functional requirements, acceptance criteria, data storage plan
2. **[Architecture](ARCHITECTURE.md)** — project structure, data flows, server and client components
3. **[UI](UI.md)** — detailed RHS interface, form, and entry list specification
4. **[Solidtime API](SOLIDTIME_API.md)** — full API reference (68 endpoints), data models, plugin field mapping; OpenAPI: [solidtime-openapi.json](solidtime-openapi.json)
5. **[Development](DEVELOPMENT.md)** — build, deploy, testing, coding conventions
6. **[Reference plugins](REFERENCE_PLUGINS.md)** — our Mattermost plugins as code examples
7. **[Mattermost Plugin Docs](mattermost/README.md)** — local copy of official Mattermost documentation

## Reading order

| Role | Recommended order |
|------|-------------------|
| New developer | README → SPECIFICATION → ARCHITECTURE → DEVELOPMENT |
| Frontend | SPECIFICATION → UI → SOLIDTIME_API |
| Backend | SPECIFICATION → ARCHITECTURE → SOLIDTIME_API |
| AI agent (Cursor) | `.cursor/rules/` → SPECIFICATION → REFERENCE_PLUGINS |

## Keeping docs up to date

Documentation is the project contract. Update the relevant files whenever functionality changes. See `.cursor/rules/documentation.mdc`.
