# Список дел: Express и PostgreSQL

Приложение «Список дел» на Node.js + Express + PostgreSQL. Реализованы создание,
переименование, отметка выполнения и удаление дел. Все данные хранятся в БД
PostgreSQL (Supabase) и сохраняются после перезапуска приложения.

- **HTTPS-адрес:** https://soffia-k-todo-express-e244.twc1.net/
- **Автор:** София Коваленко, логин Moodle: `soffiya_k`
- - **Node.js:** v24.22.3 (на хостинге Timeweb), локально v24.22.0
- **PostgreSQL:** 17.12 (Supabase)
- **Площадка БД:** Supabase (Transaction pooler)
- **Хостинг приложения:** Timeweb Cloud (App Platform)

## Структура приложения

```
src/server.js        — точка входа Express
src/config.js        — чтение .env и обязательных переменных
src/db.js            — пул подключений к PostgreSQL (pg)
src/auth.js          — middleware проверки Bearer-токена
src/validate.js      — валидация title, runId, UUID, done
src/routes/login.js  — GET /login/
src/routes/author.js — GET /api/author/
src/routes/tasks.js  — CRUD /api/tasks/
public/              — HTML/JS-интерфейс
migrations/001_init.sql — SQL-схема таблицы tasks
```

## Схема данных и сопоставление полей

Таблица `tasks` (схема `public`, база `postgres`):

| Поле API | Столбец БД | Тип | Кто задаёт |
|---|---|---|---|
| `id` | `id` | UUID, PK | сервер |
| `ownerLogin` | `owner_login` | TEXT | сервер (из конфига) |
| `title` | `title` | TEXT (1–200 после trim) | клиент |
| `done` | `done` | BOOLEAN | сервер (false при создании), клиент при PATCH |
| `runId` | `run_id` | TEXT (`[A-Za-z0-9_-]{1,64}`) | клиент |
| `createdAt` | `created_at` | TIMESTAMPTZ → ISO 8601 UTC | сервер |

SQL-схема — в `migrations/001_init.sql`.

## HTTP API

Все маршруты `/api/` требуют `Authorization: Bearer <API_TOKEN>`; без корректного
токена — `401`. Ответы с телом — `application/json`. Ошибки — `{"error":"..."}`.
Все маршруты оканчиваются на `/`.

| Метод и путь | Описание | Успех |
|---|---|---|
| `GET /login/` | логин Moodle, `text/plain`, без токена | 200 |
| `GET /api/author/` | `{login, fullName}` | 200 |
| `POST /api/tasks/` | тело `{title, runId}` | 201 |
| `GET /api/tasks/?runId=…` | массив дел автора с этим runId | 200 / `[]` |
| `GET /api/tasks/:id/` | одно дело | 200 / 404 |
| `PATCH /api/tasks/:id/` | `{title}` и/или `{done}` | 200 / 404 |
| `DELETE /api/tasks/:id/` | удаление, без тела | 204 / 404 |

Ошибки валидации: неверный JSON, лишние поля, неверные типы, неверный UUID,
отсутствие `runId` — `400`. Ошибка БД — `503`.

## Сравнение вариантов размещения

| Вариант | СУБД / среда | Тариф | Ограничения и пригодность | Результат проверки | Источник, дата |
|---|---|---|---|---|---|
| **Supabase** | PostgreSQL 15 | **Free: $0/мес, постоянно бесплатный** | 500 МБ БД; пауза проекта после 1 недели неактивности; 2 активных проекта; shared CPU, 500 МБ RAM; 5 ГБ egress; логи 1 день. **Подходит: БД + pooler по IPv4.** | Регистрация без карты; подключение по **Transaction pooler (6543)** работает; созданы `tasks`, персональное дело, `checker` | supabase.com/pricing, 2026-11-22 |
| **Timeweb Cloud** | PostgreSQL (Managed) + App Platform (Node.js) | **Платный**: от ~510 ₽/мес; **нужна карта** | Нет постоянно бесплатного тарифа; HTTPS в App Platform — автоматически. **Подходит: хостинг приложения + HTTPS.** | Развёрнуто в **App Platform**; получен HTTPS `sofia-todo-express-e244.twc1.net`; API и БД работают | timeweb.cloud, 2026-11-22 |
| **Helios (факультет)** | FreeBSD, аккаунт студента, доступ по **SSH/FTP** | Бесплатный (учебный аккаунт) | Нет данных о доступной СУБД, PaaS и HTTPS-домене; только SSH/FTP. **Не подходит как площадка для БД/приложения** без отдельного согласования | Доступ по SSH не запрашивался; СУБД не выдана; как хостинг не использовался | Инструкция факультета, 2026-11-22 |

**Обоснование выбора.** Supabase — **постоянно бесплатный** PostgreSQL 15 с Transaction pooler по IPv4 и возможностью выдать `checker` только на `tasks`; ограничения Free (500 МБ, пауза) для задания несущественны. Timeweb Cloud (App Platform) — **платный** хостинг приложения, но даёт HTTPS «из коробки» (Render требует карту). Helios — только SSH/FTP, без данных о СУБД и HTTPS, поэтому **как площадка не подходит**; зафиксировано. Итог: БД — Supabase, приложение — Timeweb App Platform.

**Различие тарифов:** Supabase — **постоянно бесплатный**; Timeweb — **платный** (карта обязательна); Helios — бесплатный учебный аккаунт, но не PaaS и без СУБД/HTTPS.

## Доступ к БД для проверяющего

Отдельный пользователь `checker` с правами **только на таблицу `tasks`**
(SELECT/INSERT/UPDATE/DELETE). Используется **Transaction pooler** Supabase
(порт 6543, IPv4). SSL обязателен.

```
Host:     aws-1-eu-west-1.pooler.supabase.com
Port:     6543
Database: postgres
User:     checker
Password: <отправлено личным сообщением в Moodle>
SSL:      require
```

Пользователь `checker` имеет права только на `public.tasks`; доступ к другим
таблицам и схемам отсутствует.

### Вариант 1 — DBeaver (рекомендуется)

1. New Database Connection → PostgreSQL.
2. Host/Port/Database/User/Password — как выше.
3. Вкладка **SSL** → ✅ **Use SSL** → **require**.
4. Test Connection → Finish.

### Вариант 2 — psql

```bash
psql "postgresql://checker:<пароль>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

Если `psql` сообщает о самоподписанном сертификате:

```bash
psql "postgresql://checker:<пароль>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=/etc/ssl/certs/ca-certificates.crt"
```

Проверка данных:

```sql
SELECT id, owner_login, title, done, run_id, created_at
FROM tasks WHERE run_id = 'manual';
```

## Переменные окружения

См. `.env.example`. Обязательные:

```
PORT=3000
OWNER_LOGIN=soffiya_k
OWNER_FULL_NAME=<ФИО>
API_TOKEN=<длинная случайная строка>
DATABASE_URL=postgresql://postgres.<ref>:<пароль>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

`OWNER_LOGIN` и `OWNER_FULL_NAME` задаются в конфигурации и не принимаются из
тела запросов.

## Установка и запуск

```bash
npm ci
cp .env.example .env      # заполнить реальными значениями
psql "$DATABASE_URL" -f migrations/001_init.sql
node src/server.js
```

Приложение: http://localhost:3000

> `psql` нужен только для миграции; можно выполнить SQL из
> `migrations/001_init.sql` в DBeaver.

## Инициализация БД

```sql
-- migrations/001_init.sql
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY,
  owner_login TEXT NOT NULL,
  title       TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  run_id      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Права для проверяющего:

```sql
CREATE ROLE checker LOGIN PASSWORD '<пароль>';
GRANT CONNECT ON DATABASE postgres TO checker;
GRANT USAGE ON SCHEMA public TO checker;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tasks TO checker;
```

## Персональное дело

Через `POST /api/tasks/` создано дело:

- `title = "Итоговая работа 24.10.2026: soffiya_k"`
- `runId = "manual"`
- `ownerLogin = "soffiya_k"`

Дело создано через API и проверено в БД под пользователем `checker`.

## Примечание по SSL

Supabase pooler использует сертификат, корневой CA которого отсутствует в
системном хранилище Node.js, поэтому в `pg` задано `ssl: { rejectUnauthorized: false }`.
SSL-шифрование при этом включено.

## Примечание по Transaction pooler

Используется Transaction pooler Supabase (порт `6543`). Для CRUD-запросов этого
достаточно; ограничения — нет `LISTEN/NOTIFY` и сессионных `SET` между
транзакциями. Именованные prepared statements не используются.