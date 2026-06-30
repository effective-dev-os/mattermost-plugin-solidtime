# Server Best Practices

> **Source:** [developers.mattermost.com/integrate/plugins/components/server/best-practices](https://developers.mattermost.com/integrate/plugins/components/server/best-practices/)

## Static files

Public files go in the `public/` directory inside the plugin bundle. Include them in the Makefile.

## HTTP request authentication

`ServeHTTP` receives requests from:
1. **Mattermost clients** (authenticated) — `Mattermost-User-Id` header
2. **External services** (webhooks) — may use `Authorization`

### Rule

If the request is expected from an authenticated Mattermost user and `Mattermost-User-Id` is empty — **reject the request**.

```go
userID := r.Header.Get("Mattermost-User-ID")
if userID == "" {
    http.Error(w, "Not authorized", http.StatusUnauthorized)
    return
}
```

### External Authorization (v9.4+)

External systems may use the `Authorization` header with their own token (not a Mattermost user token).

## Reference in Solidtime Plugin

Middleware `MattermostAuthorizationRequired` in `server/api.go` — follows this pattern.

Solidtime tokens are **never** accepted via HTTP from the webapp — only from KV Store on the server.
