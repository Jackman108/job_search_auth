# Market Hunter — Auth service

Сервис аутентификации и пользовательских данных для продукта **job_search** (Market Hunter).

> Не путать с `Documents/job-hunt` — там канон найма/CV, не этот Nest-сервис.

## Стек

NestJS · Prisma · JWT · Google/Yandex OAuth · GraphQL (Apollo) · PostgreSQL

## Домен

- **JWT auth**: register / login / logout / refresh-tokens
- **OAuth**: Google и Yandex (`/api/auth/google`, `/api/auth/yandex` + callbacks)
- **Users**: REST `/api/user`
- **Prisma**: User, Token, Profile, Resume (+ contacts / experience / skills), VacancyAuth/Submit, Payment, Subscription

## GraphQL vs REST

| Поверхность | Prefix / endpoint | Для чего |
|-------------|-------------------|----------|
| **REST (основной для client)** | `/api/auth/*`, `/api/user/*` | Login, register, OAuth, logout, refresh, профиль пользователя |
| **GraphQL** | `/graphql` (schema → `schema.graphql`) | Read-only introspection: `users`, `tokens` |

Клиент (`client/`) ходит в auth через REST (`AUTH_URL`, по умолчанию `http://localhost:8001/api`). GraphQL сейчас вспомогательный/админский слой, не основной контракт UI.

## Порты (dev)

| Сервис | Порт |
|--------|------|
| Auth API | `APP_PORT` → **8001** |
| Auth Postgres | **5433** → `db_test` (`yarn docker:up`) |
| Auth Redis | **6379** (sessions) |
| Client | 3000 |
| Backend API / WS | 8000 / 8080 |

Полный подъём стека: корневой [`docs/DEV_SETUP.md`](../docs/DEV_SETUP.md).

## Установка

```bash
yarn install
cp .env.example .env   # заполнить JWT, OAuth, DATABASE_URL, APP_PORT, ALLOWED_ORIGIN
yarn prisma generate
yarn start:dev
```

DB + Redis (compose в `docker/postgres`): Postgres **5433**, Redis **6379**.
Не занимает backend-порт **5432**.

```bash
yarn docker:up
# DATABASE_URL=postgresql://postgres:123456@localhost:5433/db_test?schema=public
# REDIS_URI=redis://localhost:6379
yarn prisma migrate deploy   # или migrate dev — на чистой db_test
```

## Scripts

```bash
yarn start:dev    # watch
yarn build && yarn start:prod
yarn test
```
