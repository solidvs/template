# Database

The data layer follows ADR-0016 of the standard stack: one model, PostgreSQL as the reference
engine and SQL Server supported, one database and two logins per system and environment.

| Path | What it is |
|---|---|
| `apps/api/prisma/schema.prisma` | The model, written for PostgreSQL with only what both engines accept |
| `apps/api/prisma/sqlserver/schema.prisma` | Derived by `pnpm db:derive`; never edited by hand |
| `apps/api/prisma/migrations/<engine>/` | One migration per change and engine, reviewed in the pull request |
| `apps/api/prisma/migrations/model.prisma` | The model as of the last migration (input of the next one) |
| `apps/api/prisma.config.ts` | Engine, schema and migrations folder; connection from the configuration file |
| `apps/api/src/database.ts` | The data module: Prisma client with the application login, audit trail |
| `apps/api/src/modules/<module>/infrastructure/` | Repositories: the only module code that sees Prisma |
| `apps/api/src/seed.ts` | Synthetic data for development databases |

Run the commands below from `apps/api` (or with `pnpm --filter @example/api`).

## Changing the model

1. Edit `prisma/schema.prisma`. Every `String` declares `@db.Text` or `@db.VarChar(n)`; no
   `Json`, `enum` or lists (store structured values as text validated with zod). Keep the
   `AuditEvent` model as it is: it belongs to the platform.
2. `pnpm db:migration <name>` (lowercase snake_case, e.g. `add_project_owner`): writes
   `prisma/migrations/postgresql/<timestamp>_<name>/migration.sql`, the same for SQL Server, and
   the derived SQL Server schema. No database is needed.
3. Read both SQL files. A migration that drops or renames a column goes in two releases: first
   stop using it, then drop it.
4. `pnpm db:deploy && pnpm db:drift` against the laboratory database, then `pnpm test:db`.
5. Commit the model, both migrations and the derived schema together. CI checks that they agree
   (`db:check`), applies them to PostgreSQL and SQL Server, compares the result with the model and
   runs the system against both.

A merged migration is never edited. To fix one, write a new migration.

## Laboratory database

```sh
pnpm db:lab              # PostgreSQL container, database example_dev, both logins;
                         # DATABASE_ENGINE=sqlserver LAB_MSSQL_ACCEPT_EULA=Y for SQL Server
pnpm db:deploy           # migrations, with the migration login (config.migration.local.json)
pnpm db:drift            # the database matches the model
pnpm build && pnpm db:seed   # synthetic projects, with the application login
pnpm test:db             # the system over HTTP against the database
pnpm db:lab:down         # remove it, data and secrets included
```

`db:lab` adds the `DATABASE_*` keys of the application login to `config.local.json` and writes
the migration login to `config.migration.local.json`. Both files are never committed. SQL Server on
Apple silicon needs Docker with Rosetta (see the platform kit's README).

## In staging and production

- The database and both logins are created by a platform administrator with the provisioning
  procedure of `@solidvs/server` (`database/README.md` in the package). This system never
  creates or drops databases.
- The service receives only the application login. The data module refuses to start when the
  login has DDL rights or when `audit_event` is not insert-only.
- Migrations run in the deploy step, from the migration image, with the migration login
  (`deploy.md`).
- Backups are the installation's existing routine for its engine.
