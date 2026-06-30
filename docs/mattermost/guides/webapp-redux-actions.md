# Redux Actions for Webapp Plugins

> **Source:** [developers.mattermost.com/integrate/plugins/components/webapp/actions](https://developers.mattermost.com/integrate/plugins/components/webapp/actions/)

## mattermost-redux

Shared code library used across Mattermost JS clients. Exports:

| Category | Purpose |
|----------|---------|
| `actions` | API requests, state changes |
| `client` | `Client4` for direct API calls |
| `constants` | Data model constants |
| `selectors` | Read data from Redux store |
| `store` | Redux store functions |
| `types` | TypeScript types |
| `utils` | Utilities |

## Selector example

```typescript
import {useSelector} from 'react-redux';
import {getPost} from 'mattermost-redux/selectors/entities/posts';
import {getCurrentUser} from 'mattermost-redux/selectors/entities/users';
import {getCurrentChannel} from 'mattermost-redux/selectors/entities/channels';
import {getCurrentTeam} from 'mattermost-redux/selectors/entities/teams';

const MyComponent = ({postId}) => {
    const post = useSelector((state) => getPost(state, postId));
    const currentUser = useSelector(getCurrentUser);
    const currentChannel = useSelector(getCurrentChannel);
    const currentTeam = useSelector(getCurrentTeam);
};
```

## Commonly used selectors

- `getCurrentUserId(state)` — current user ID
- `getCurrentUser(state)` — current user profile
- `getCurrentChannelId(state)` / `getCurrentChannel(state)` — current channel
- `getCurrentTeamId(state)` / `getCurrentTeam(state)` — current team
- `getPost(state, postId)` — post by ID

## Commonly used actions

- `createChannel(channel, userId)`
- `createPost(post, files?)`
- `getMyTeams()`
- `patchUser(user)`

## registerReducer

```typescript
registry.registerReducer(reducer);
// State is available as state['plugins-<pluginId>']
```

## Client4.getOptions

For fetch requests to the plugin API with a CSRF token:

```typescript
const response = await fetch(url, Client4.getOptions(options));
```

See [Webapp Best Practices](webapp-best-practices.md) for `getPluginServerRoute`.
