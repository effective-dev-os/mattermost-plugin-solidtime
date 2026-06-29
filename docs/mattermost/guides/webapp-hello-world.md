# Webapp Hello World

> **Источник:** [developers.mattermost.com/integrate/plugins/components/webapp/hello-world](https://developers.mattermost.com/integrate/plugins/components/webapp/hello-world/)

Руководство по созданию первого webapp-плагина Mattermost.

## Prerequisites

- React + Redux (как в Mattermost webapp)
- npm
- Mattermost server с `PluginSettings.Enable: true` и `EnableUploads: true`

## Минимальный пример

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

## Важные замечания

- `react` указывается как **external** в webpack — используется версия React из Mattermost
- На практике используй [mattermost-plugin-starter-template](https://github.com/mattermost/mattermost-plugin-starter-template) для build scripts
- Plugin API изменился в Mattermost 5.2 — см. migration guide для старых плагинов

## registerChannelHeaderButtonAction

Параметры:
- `icon` — React-элемент иконки кнопки
- `action` — функция при клике (получает channel и channel member)
- `dropdownText` — текст в dropdown (если несколько plugin buttons)

См. также [Webapp SDK Reference](../reference/webapp-reference.md).
