# Webapp Best Practices

> **Источник:** [developers.mattermost.com/integrate/plugins/components/webapp/best-practices](https://developers.mattermost.com/integrate/plugins/components/webapp/best-practices/)

## Design: где размещать UI

| Сценарий | Registry-метод | Примеры |
|----------|----------------|---------|
| Действия в контексте канала | `registerChannelHeaderButtonAction` | Zoom, Solidtime |
| Действия над сообщением | `registerPostDropdownMenuAction` | Jira, copy message |
| Файлы/изображения | `registerFileUploadMethod` | OneDrive, Draw |
| Действия команды | `registerLeftSidebarHeaderComponent` | Trello, GitHub |
| Quick links / статусы | `registerBottomTeamSidebarComponent` | GitHub reviews |
| Глобальные действия | `registerMainMenuAction` + slash command | Feedback, /jira |
| Действия над пользователем | `registerPopoverUserActionsComponent` | Report User |
| Атрибуты профиля | `registerPopoverUserAttributesComponent` | Custom Attributes |
| RHS sidebar | `registerRightHandSidebarComponent` | Agents, Solidtime |

## SiteURL в API-запросах

```typescript
export const getPluginServerRoute = (state) => {
    const config = getConfig(state);
    let basePath = '';
    if (config && config.SiteURL) {
        basePath = new URL(config.SiteURL).pathname;
        if (basePath && basePath[basePath.length - 1] === '/') {
            basePath = basePath.substr(0, basePath.length - 1);
        }
    }
    return basePath + '/plugins/' + PluginId;
};
```

## CSRF token

```typescript
const response = await fetch(url, Client4.getOptions(options));
```

Обязательно для всех fetch-запросов из webapp к plugin API.

## Референс в наших плагинах

- `com.effective.food-ordering/webapp/src/client.ts` — готовый API-клиент
- `mattermost-plugin-agents/webapp/src/client.ts` — SiteURL + fetch
