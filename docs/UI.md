# Спецификация пользовательского интерфейса

Описание UI правой боковой панели (RHS) на основе референсного дизайна Solidtime/Clockify-подобного таймтрекера.

## Общие принципы

- Компактный layout, оптимизированный для узкой RHS Mattermost (~400px).
- Светлая тема по умолчанию; поддержка тёмной темы Mattermost через CSS-переменные.
- Синий акцент (`#1C58D9` или системный `--button-bg`) для primary-действий.
- Шрифт — системный Mattermost (Open Sans / Metropolis).

## Layout RHS

```
┌─────────────────────────────────────────┐
│ Solidtime                          [×]  │  ← заголовок RHS (Mattermost)
├─────────────────────────────────────────┤
│ [Organization ▼]                        │  ← org selector (если >1 org)
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Description                         │ │
│ │ [ What have you worked on?        ] │ │
│ │ Project *  (или Project * │ Time)  │ │
│ │ [ Select project              ▾ ] │ │
│ │ Time: $ 15:40-16:40  Jun 29       │ │  ← узкий RHS: столбец
│ │ [ Manual | Timer ]    [ Add entry ] │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Week total: 00:00                    │  ← summary bar
├─────────────────────────────────────────┤
│ Today                                   │  ← day header
│ ┌─────────────────────────────────────┐ │
│ │ Test                    02:30:00    │ │
│ │ ● Project name — Client  $          │ │
│ │ 15:33 - 15:33  📅                   │ │
│ └─────────────────────────────────────┘ │
│                                         │  ← scrollable area
│ ...more entries...                      │
│                                         │
├─────────────────────────────────────────┤
│  ◄  Jun 23 – Jun 29, 2026  ►           │  ← fixed footer
└─────────────────────────────────────────┘
```

## Компоненты

### 0. Экран подключения (`connect_panel.tsx`)

Показывается в RHS, если пользователь не подключён:

```
┌─────────────────────────────────────────┐
│ Connect to Solidtime                    │
│                                         │
│ 1. Open your Solidtime profile ↗        │
│ 2. In Create API Token — generate token │
│ 3. Paste below and click Connect        │
│                                         │
│ API TOKEN                               │
│ [ •••••••••••••••••••••••••••••••• ]   │
│ [ Connect ]                             │
└─────────────────────────────────────────┘
```

- Ссылка на профиль: `{SolidtimeServerURL}/user/profile`, `target="_blank"`.
- Поле токена — `type="password"`; кнопка вызывает `POST /connection/connect`.
- WS `solidtime-connection-change` переключает RHS на основной layout.

### 0.1. Селектор организации (`org_selector.tsx`)

- `<select>` над формой; виден только при `organizations.length > 1`.
- При смене: `PUT /organizations/current` → сброс projects/entries → reload.
- Синхронизация через WS `custom_{pluginId}_solidtime-org-change`.

### 1. Форма добавления записи

Вертикальный stack: Description на всю ширину; **Project и Time** — в одной строке при ширине формы ≥400px, иначе друг под другом.

```
Узкий RHS (<400px)          Широкий RHS (≥400px)
┌─────────────────────┐      ┌─────────────────────┐
│ DESCRIPTION         │      │ DESCRIPTION         │
│ [ What have you...] │      │ [ What have you...] │
│ PROJECT *           │      │ PROJECT * │ TIME    │
│ [ ● Idle Time   ▾ ] │      │ [ Idle ▾ ]│ $15:40📅│
│ TIME                │      │ [ Manual | Timer ]  │
│ $ 15:40 - 16:40 📅  │      │      [ Add entry ]  │
│ [ Manual | Timer ]  │      └─────────────────────┘
│      [ Add entry ]  │
└─────────────────────┘
```

**Поля**
- Description — полноширинный input с label.
- Project + Time — адаптивная строка через CSS container query на `.solidtime-form`; в узком режиме полная дата видна, в широком — только иконка календаря (`title` при hover).
- Project — field-style селектор (border, chevron); placeholder «Select project».
- Time — панель: billable `$`, time range + date, или elapsed в Timer mode.

**Footer**
- Segmented control **Manual | Timer** (вместо скрытого ⋮); выбор сохраняется в `localStorage` per-user.
- Primary button: **Add entry** / **Start timer** / **Stop timer**.
- Manual mode недоступен пока таймер запущен.

#### Dropdown выбора проекта

```
┌──────────────────────────────────┐
│ 🔍 Search Project or Client      │
├──────────────────────────────────┤
│ ▼ CLIENT NAME          1 Project ↗│
│   ● Project name                 ☆ │
├──────────────────────────────────┤
│ ▼ TEST                 1 Project ↗│
│   ● test                         ☆ │
└──────────────────────────────────┘
```

- Поиск по названию проекта и клиента.
- Группировка по клиентам (collapsible headers).
- Цветная точка (`●`) — цвет проекта из Solidtime.
- `☆` — toggle избранного проекта (localStorage `solidtime_favorites_{userId}`); избранные — секция сверху dropdown.
- Раскрытие проекта показывает список существующих задач для выбора.

#### Строка 2 (legacy inline в карточках записей)

В карточках списка — компактный inline layout (описание + project link).

#### Date Picker

```
┌──────────────────────────────────┐
│  ◄  Jun 2026  ►                  │
├──────────────────────────────────┤
│ Mo Tu We Th Fr Sa Su             │
│                   1  2  3  4  5  │
│  6  7  8  9 10 11 12             │
│ 13 14 15 16 17 18 19             │
│ 20 21 22 23 24 25 26             │
│ 27 28 [29] 30  1  2  3           │
└──────────────────────────────────┘
```

- Popover, привязанный к иконке календаря **в строке времени** (справа от `HH:mm - HH:mm`).
- Текущая дата выделена синим квадратом.
- Даты других месяцев — серым.

### 2. Summary Bar

- Фон: светло-серый (`#F0F0F0` / `--center-channel-bg`).
- Текст: `Week total: HH:MM` (жирный).
- Обновляется при загрузке и после добавления записи.

### 3. Список записей

#### Заголовок дня

- Фон: чуть темнее summary bar.
- Текст: `Today`, `Yesterday`, или `Mon, Jun 23`.

#### Карточка записи (inline-редактирование)

Каждая запись в списке — редактируемая сущность с теми же полями, что и форма добавления. Отдельного режима «редактирования» нет: поля доступны для изменения прямо в карточке.

```
Test                              02:30:00  [×]
● Project name — Client    $
15:33 - 15:33  📅
```

- Кнопка **×** → **OK** — двухшаговое подтверждение удаления (`DELETE /time-entries/{id}`).

| Поле | Элемент UI | Поведение |
|------|------------|-----------|
| Описание | `text input` | Текущее значение `description`; placeholder как в форме добавления |
| Проект | селектор проекта | Тот же dropdown, что в форме; `● {project_name} — {client_name}` |
| Billable | toggle `$` | Как в форме добавления |
| Время и дата | time range + `📅` | `HH:mm - HH:mm` и кнопка календаря в одной строке; длительность справа пересчитывается при изменении времени |

**Сохранение изменений**

- При **потере фокуса** (`blur`) поля ввода или при **изменении значения** (toggle, выбор в dropdown, date/time picker) — отправляется `PUT /api/v1/time-entries/{id}` к плагину.
- Плагин проксирует обновление в Solidtime (`PUT /organizations/{org_id}/time-entries/{id}`).
- Пока запрос в полёте — поле в состоянии loading/disabled; при ошибке — toast и откат к последнему сохранённому значению.
- Успешное обновление — пересчёт week total и, при смене даты, перемещение записи в нужную группу дня.

### 4. Футер пагинации

- `position: sticky; bottom: 0` внутри RHS.
- Фон совпадает с RHS.
- Верхняя граница (border-top).
- Содержимое: `◄  {date range}  ►`.
- Стрелки переключают неделю; список записей обновляется.

## Channel Header Button / Timer Widget

**Без активного таймера:**
- Иконка: логотип Solidtime (SVG, ~24×24px).
- Клик → открыть/закрыть RHS.

**С активным таймером** (`channel_header_timer.tsx`):
```
[■]  01:23
```
- **■** — STOP (`PUT` с `end: now`); hit-area **28×28px**, иконка 14×14px, hover-подсветка.
- **01:23** — тикающее elapsed (`HH:MM`); клик → открыть/закрыть RHS.
- Синхронизация: mount, WS `solidtime-timer-change`, `GET /time-entries/active` при reconnect.

**Общее:**
- Видна только при активном плагине с настроенным `SolidtimeServerURL`.
- При наведении — tooltip «Open Solidtime Time Tracker».
- Если зарегистрировано несколько plugin buttons — попадает в dropdown Mattermost.

## Состояния и feedback

| Состояние | Поведение |
|-----------|-----------|
| Загрузка | Skeleton/spinner в области списка |
| Пустой список | «No time entries for this period» |
| Ошибка API | Toast/alert с описанием ошибки |
| Успешное добавление | Форма сбрасывается, список обновляется |
| Сохранение записи | Индикатор на поле; week total и группировка по дням обновляются |
| Ошибка сохранения записи | Toast; поле возвращается к последнему сохранённому значению |
| Не выбран проект | Кнопка ADD disabled, подсказка у селектора |
| Не настроен URL | Плагин не активируется; кнопка скрыта |
| Не подключён | Кнопка видна; RHS — экран подключения (`connect_panel`); `not_connected` от API сбрасывает таймер в header |
| Удаление записи | Карточка исчезает; week total пересчитывается |
| Смена org | Projects/entries перезагружаются для новой org |
| Timer START | Header показывает виджет; форма в Timer Mode — elapsed |
| Timer STOP | Запись появляется в списке с duration |

## Адаптивность

- RHS Mattermost имеет переменную ширину; горизонтальный скролл недопустим.
- Форма: Project и Time в столбец при ширине <400px, в строку при ≥400px (container query).
- На мобильных устройствах RHS открывается на весь экран — обычно достаточно для строки Project+Time.

## Файлы компонентов (план)

```
webapp/src/components/
├── channel_header_button.tsx
├── channel_header_timer.tsx     # Виджет таймера в header
└── rhs/
    ├── sidebar.tsx
    ├── connect_panel.tsx        # Экран подключения (не подключён)
    ├── org_selector.tsx
    ├── time_entry_form.tsx
    ├── project_selector.tsx
    ├── date_picker.tsx
    ├── time_range_input.tsx
    ├── time_entry_list.tsx
    ├── time_entry_card.tsx
    ├── week_total_bar.tsx
    └── pagination_footer.tsx
webapp/src/
├── reducer.ts                   # activeTimer, entryMode, selectedOrgId
├── selectors.ts
└── utils/
    ├── time.ts                  # formatElapsed
    └── favorites.ts             # localStorage избранных проектов
```
