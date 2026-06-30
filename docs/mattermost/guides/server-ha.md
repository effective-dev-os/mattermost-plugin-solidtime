# High Availability (HA)

> **Source:** [developers.mattermost.com/integrate/plugins/components/server/ha](https://developers.mattermost.com/integrate/plugins/components/server/ha/)

## Principle

In HA mode (Enterprise E20), a **separate copy** of the plugin runs on each app server. Copies are isolated — in-memory state is **not shared**.

## Stateless plugins

The plugin **must not** store data in memory that is needed across requests. Use:
- **KV Store** (plugin API)
- Database (if necessary)

### Anti-pattern

```go
// ❌ BAD: trigger word only on app server 1
var triggerWord string

func (p *Plugin) SetTrigger(word string) {
    triggerWord = word // lost on other servers
}
```

### Correct approach

```go
// ✅ GOOD: KV Store is available to all instances
p.API.KVSet("trigger_word", []byte(word))
```

## Cluster jobs

For background tasks in HA, use `pluginapi/cluster`:

```go
job, err := cluster.Schedule(
    p.API,
    "BackgroundJob",
    cluster.MakeWaitForRoundedInterval(15*time.Minute),
    p.BackgroundJobFunc,
)
```

Only one plugin instance will run the job in a given interval.

## Relevance for Solidtime Plugin

- User API tokens → **KV Store** (already in specification)
- Organization/Member ID cache → **KV Store**
- Do not cache tokens in package-level variables

See reference: `mattermost-plugin-yandex-calendar/calendar/jobs/`
