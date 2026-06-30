# Webapp Best Practices

> **Source:** [developers.mattermost.com/integrate/plugins/components/webapp/best-practices](https://developers.mattermost.com/integrate/plugins/components/webapp/best-practices/)

## Design: where to place UI

| Scenario | Registry method | Examples |
|----------|----------------|---------|
| Channel-context actions | `registerChannelHeaderButtonAction` | Zoom, Solidtime |
| Message actions | `registerPostDropdownMenuAction` | Jira, copy message |
| Files/images | `registerFileUploadMethod` | OneDrive, Draw |
| Team actions | `registerLeftSidebarHeaderComponent` | Trello, GitHub |
| Quick links / statuses | `registerBottomTeamSidebarComponent` | GitHub reviews |
| Global actions | `registerMainMenuAction` + slash command | Feedback, /jira |
| User actions | `registerPopoverUserActionsComponent` | Report User |
| Profile attributes | `registerPopoverUserAttributesComponent` | Custom Attributes |
| RHS sidebar | `registerRightHandSidebarComponent` | Agents, Solidtime |

## SiteURL in API requests

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

Required for all fetch requests from the webapp to the plugin API.

## Reference in our plugins

- `com.effective.food-ordering/webapp/src/client.ts` — ready-made API client
- `mattermost-plugin-agents/webapp/src/client.ts` — SiteURL + fetch
