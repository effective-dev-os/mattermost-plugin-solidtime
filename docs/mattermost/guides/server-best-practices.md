# Server Best Practices

> **Источник:** [developers.mattermost.com/integrate/plugins/components/server/best-practices](https://developers.mattermost.com/integrate/plugins/components/server/best-practices/)

## Static files

Публичные файлы — в директории `public/` внутри plugin bundle. Включать в Makefile.

## Аутентификация HTTP-запросов

`ServeHTTP` получает запросы от:
1. **Mattermost clients** (авторизованные) — заголовок `Mattermost-User-Id`
2. **Внешние сервисы** (webhooks) — могут использовать `Authorization`

### Правило

Если запрос ожидается от авторизованного Mattermost-пользователя и `Mattermost-User-Id` пуст — **отклонить запрос**.

```go
userID := r.Header.Get("Mattermost-User-ID")
if userID == "" {
    http.Error(w, "Not authorized", http.StatusUnauthorized)
    return
}
```

### External Authorization (v9.4+)

Внешние системы могут использовать `Authorization` header со своим токеном (не user token Mattermost).

## Референс в Solidtime Plugin

Middleware `MattermostAuthorizationRequired` в `server/api.go` — следует этому паттерну.

Токены Solidtime **никогда** не принимаются через HTTP от webapp — только из KV Store на сервере.
