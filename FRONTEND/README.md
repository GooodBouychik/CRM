# Team CRM Frontend

Современный фронтенд для Team CRM на React + Vite + TypeScript.

## Технологии

- **React 18** + **TypeScript**
- **Vite** - сборка
- **TanStack Query** - управление серверным состоянием
- **Zustand** - локальное состояние
- **Tailwind CSS** - стилизация
- **Shadcn/ui** - UI компоненты
- **Recharts** - графики
- **Lucide React** - иконки

## Установка

```bash
npm install
```

## Запуск

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Превью сборки
npm run preview
```

## Конфигурация

Создайте файл `.env` в корне FRONTEND:

```env
VITE_API_URL=http://localhost:3001
```

## Структура

```
src/
├── components/     # React компоненты
│   ├── ui/        # Базовые UI компоненты (shadcn)
│   ├── Dashboard.tsx
│   ├── OrdersPage.tsx
│   ├── ClientsPage.tsx
│   ├── CalendarPage.tsx
│   ├── StatisticsPage.tsx
│   ├── ActivityPage.tsx
│   ├── ArchivePage.tsx
│   ├── AccountsPage.tsx
│   ├── SettingsPage.tsx
│   └── ...
├── lib/           # Утилиты и API
│   ├── api.ts     # API клиент
│   └── utils.ts   # Вспомогательные функции
├── stores/        # Zustand stores
├── types/         # TypeScript типы
├── data/          # Mock данные (fallback)
├── hooks/         # React хуки
└── pages/         # Страницы
```

## Функциональность

- **Дашборд** - обзор заказов, задач, дедлайнов
- **Заказы** - CRUD операции, фильтрация, поиск
- **Клиенты** - база клиентов, статистика
- **Календарь** - дедлайны подзадач
- **История** - хронология заказов
- **Статистика** - графики и аналитика
- **Активность** - лента действий
- **Архив** - завершённые заказы
- **Аккаунты** - хранилище паролей
- **Настройки** - уведомления и предпочтения

## API

Фронтенд работает с бэкендом на порту 3001. Все API вызовы находятся в `src/lib/api.ts`.

При недоступности API используются mock данные из `src/data/mockData.ts`.
