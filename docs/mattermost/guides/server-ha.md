# High Availability (HA)

> **Источник:** [developers.mattermost.com/integrate/plugins/components/server/ha](https://developers.mattermost.com/integrate/plugins/components/server/ha/)

## Принцип

В HA-режиме (Enterprise E20) на каждом app server запускается **отдельная копия** плагина. Копии изолированы — in-memory state **не разделяется**.

## Stateless plugins

Плагин **не должен** хранить данные в памяти, которые нужны между запросами. Используй:
- **KV Store** (plugin API)
- База данных (если необходимо)

### Антипаттерн

```go
// ❌ BAD: trigger word только на app server 1
var triggerWord string

func (p *Plugin) SetTrigger(word string) {
    triggerWord = word // потеряется на других серверах
}
```

### Правильно

```go
// ✅ GOOD: KV Store доступен всем инстансам
p.API.KVSet("trigger_word", []byte(word))
```

## Cluster jobs

Для фоновых задач в HA используй `pluginapi/cluster`:

```go
job, err := cluster.Schedule(
    p.API,
    "BackgroundJob",
    cluster.MakeWaitForRoundedInterval(15*time.Minute),
    p.BackgroundJobFunc,
)
```

Только один инстанс плагина выполнит job в заданный интервал.

## Релевантность для Solidtime Plugin

- API-токены пользователей → **KV Store** (уже в спецификации)
- Organization/Member ID cache → **KV Store**
- Не кэшировать токены в переменных пакета

См. референс: `mattermost-plugin-yandex-calendar/calendar/jobs/`
