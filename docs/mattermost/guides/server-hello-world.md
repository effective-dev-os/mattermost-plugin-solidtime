# Server Plugin Quick Start

> **Источник:** [developers.mattermost.com/integrate/plugins/components/server/hello-world](https://developers.mattermost.com/integrate/plugins/components/server/hello-world/)

## Минимальный server plugin (Go)

```go
package main

import (
    "fmt"
    "net/http"
    "github.com/mattermost/mattermost/server/public/plugin"
)

type HelloWorldPlugin struct {
    plugin.MattermostPlugin
}

func (p *HelloWorldPlugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
    fmt.Fprint(w, "Hello, world!")
}

func main() {
    plugin.ClientMain(&HelloWorldPlugin{})
}
```

## plugin.json

```json
{
    "id": "com.mattermost.server-hello-world",
    "name": "Hello World",
    "server": {
        "executable": "plugin.exe"
    }
}
```

## Cross-platform build

```bash
GOOS=linux GOARCH=amd64 go build -o plugin-linux-amd64 plugin.go
```

Для production используй [mattermost-plugin-starter-template](https://github.com/mattermost/mattermost-plugin-starter-template) Makefile.

## URL плагина

После установки: `https://<site>/plugins/<plugin-id>/`

См. [Server SDK Reference](../reference/server-reference.md) для всех хуков.
