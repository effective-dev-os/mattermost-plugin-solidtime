# Webapp Hello World

> **Source:** [developers.mattermost.com/integrate/plugins/components/webapp/hello-world](https://developers.mattermost.com/integrate/plugins/components/webapp/hello-world/)

Guide to creating your first Mattermost webapp plugin.

## Prerequisites

- React + Redux (as in Mattermost webapp)
- npm
- Mattermost server with `PluginSettings.Enable: true` and `EnableUploads: true`

## Minimal example

```jsx
import React from 'react';

const Icon = () => <i className='icon fa fa-plug'/>;

class HelloWorldPlugin {
    initialize(registry, store) {
        registry.registerChannelHeaderButtonAction(
            <Icon />,
            () => { alert("Hello World!"); },
            "Hello World",
        );
    }
}

window.registerPlugin('com.mattermost.webapp-hello-world', new HelloWorldPlugin());
```

## plugin.json

```json
{
    "id": "com.mattermost.webapp-hello-world",
    "name": "Hello World",
    "webapp": {
        "bundle_path": "main.js"
    }
}
```

## Important notes

- `react` is declared as **external** in webpack — the React version from Mattermost is used
- In practice, use [mattermost-plugin-starter-template](https://github.com/mattermost/mattermost-plugin-starter-template) for build scripts
- Plugin API changed in Mattermost 5.2 — see migration guide for older plugins

## registerChannelHeaderButtonAction

Parameters:
- `icon` — React element for the button icon
- `action` — click handler (receives channel and channel member)
- `dropdownText` — text in the dropdown (when multiple plugin buttons are present)

See also [Webapp SDK Reference](../reference/webapp-reference.md).
