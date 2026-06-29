# Redux Actions for Webapp Plugins

> **Источник:** [developers.mattermost.com/integrate/plugins/components/webapp/actions](https://developers.mattermost.com/integrate/plugins/components/webapp/actions/)

## mattermost-redux

Библиотека общего кода между Mattermost JS-клиентами. Экспортирует:

| Категория | Назначение |
|-----------|------------|
| `actions` | API-запросы, изменение state |
| `client` | `Client4` для прямых API-вызовов |
| `constants` | Константы data model |
| `selectors` | Чтение данных из Redux store |
| `store` | Функции Redux store |
| `types` | TypeScript-типы |
| `utils` | Утилиты |

## Пример selectors

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

## Часто используемые selectors

- `getCurrentUserId(state)` — ID текущего пользователя
- `getCurrentUser(state)` — профиль текущего пользователя
- `getCurrentChannelId(state)` / `getCurrentChannel(state)` — текущий канал
- `getCurrentTeamId(state)` / `getCurrentTeam(state)` — текущая команда
- `getPost(state, postId)` — пост по ID

## Часто используемые actions

- `createChannel(channel, userId)`
- `createPost(post, files?)`
- `getMyTeams()`
- `patchUser(user)`

## registerReducer

```typescript
registry.registerReducer(reducer);
// State доступен как state['plugins-<pluginId>']
```

## Client4.getOptions

Для fetch-запросов к plugin API с CSRF-токеном:

```typescript
const response = await fetch(url, Client4.getOptions(options));
```

См. [Webapp Best Practices](webapp-best-practices.md) для `getPluginServerRoute`.
