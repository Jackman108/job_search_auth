# Market Hunter — Auth service

Сервис аутентификации и пользовательских данных для продукта **job_search** (Market Hunter).

> Не путать с `Documents/job-hunt` — там канон найма/CV, не этот Nest-сервис.

## Стек

NestJS · Prisma · JWT · Google/Yandex OAuth · GraphQL (Apollo) · PostgreSQL

## Домен

- **JWT auth**: register / login / logout / refresh-tokens
- **OAuth**: Google и Yandex (`/api/auth/google`, `/api/auth/yandex` + callbacks)
- **Users**: REST `/api/user`
- **Prisma schema**: User, Token, Profile, Resume (+ contacts / experience / skills), VacancyAuth/Submit, Payment, Subscription  
  (HTTP CRUD for vacancy auth/field lives on **backend** `/vacancy-auth` + `/vacancy-field`, not Nest controllers)

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
| Shared Postgres | **5432** → DB `job_search` (`job_search_postgres`) |
| Auth Redis | **6379** (`job_search_redis`, sessions) |
| Optional auth Postgres | **5433** → `db_test` (profile `auth-db`) |
| Client | 3000 |
| Backend API / WS | 8000 / 8080 |

Полный подъём стека: корневой [`docs/DEV_SETUP.md`](../docs/DEV_SETUP.md) · infra `.\dev-docker.ps1`.

## Установка

```bash
yarn install
cp .env.example .env   # shared 5432/job_search + JWT matching backend
yarn prisma generate
yarn start:dev
```

DB + Redis (root `docker/docker-compose.yml` via `.\dev-docker.ps1`):
Postgres **5432** / `job_search`, Redis **6379**.

```bash
# from job_search root
.\dev-docker.ps1
# DATABASE_URL=postgresql://postgres:password@localhost:5432/job_search?schema=public
# REDIS_URI=redis://localhost:6379
yarn prisma migrate deploy
```

## Scripts

```bash
yarn start:dev    # watch
yarn build && yarn start:prod
yarn test
```
