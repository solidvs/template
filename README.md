# System template

Starting point of every system of the standard stack. A new system is a repository created from
this one ("Use this template" on GitHub), renamed, and then grown module by module.

| Path | What it is |
|---|---|
| `apps/api` | NestJS API. Serves `/api` and the web app on the same origin, in one image |
| `apps/api/src/modules/<module>/` | `domain/` (plain rules), `application/` (use cases), `infrastructure/` (I/O, the only place for Prisma), `http/` (controllers); dependencies point inwards, enforced by lint. `projects` is the example module backed by the database |
| `apps/api/prisma/` | Data model (PostgreSQL reference, SQL Server derived) and one migrations folder per engine (ADR-0016) |
| `apps/migrate` | Dependencies of the migration image (`prisma migrate deploy`, migration login only) |
| `apps/web` | React web app on `@solidvs/ui` (platform components, ADR-0011): shell, "Projetos", project pages with tabs as URLs; the build publishes `THIRD-PARTY-NOTICES.txt` |
| `packages/contracts` | Schemas of every API response; the API validates what it sends, the web app what it receives |
| `catalog-info.yaml` | How the system appears in the IT portal |
| `docs/decisions` | Decisions of this system on top of the stack |
| `docs/procedures` | How to operate it |
| `Dockerfile` | Two images per release: the application (non-root, read-only filesystem compatible, healthcheck) and the migration step (`--target migrate`); `DATABASE_ENGINE` build argument |
| `.github/workflows/ci.yaml` | Audit, model and migrations in sync, lint, build, type check, tests, the database on PostgreSQL and SQL Server, secret scan, both images built, scanned and published by digest |

What every system gets from `@solidvs/server` without writing it: sign-in through the
organization's identity provider (Keycloak federated to Active Directory, ADR-0009), server-side
sessions, the access rule, roles from directory groups, CSRF protection, rate limiting, security
headers, structured audit logs, `/api/health`, and the data layer (ADR-0016): Prisma over an
encrypted, verified connection with a login that has no DDL, and the insert-only `audit_event`
table.

## Creating a system from this template

1. **Repository:** GitHub → `solidvs/template` → *Use this template* → private
   repository named after the system id (lowercase, hyphens: `portal`, `pedidos`).
2. **Rename:** replace `example` with the system id and "Sistema de exemplo" with its name in
   `apps/api/src/system.ts`, `catalog-info.yaml`, the `name` fields of the four `package.json`
   files (`@example/…` → `@<id>/…`), imports of `@example/contracts`, `--filter @example/…` in
   the Dockerfile and the workflow, `--system example` in `apps/api/package.json`,
   `apps/web/index.html`, and the role group `GRP-Example-Admins` in `apps/api/src/app.module.ts`.
   Replace the `projects` module and the `Project` model with the system's own; keep `AuditEvent`.
3. **Access rule:** in `apps/api/src/app.module.ts`, who enters (`access`) and the roles (`roles`).
   Department may open the door; roles that change data come from directory groups only.
4. **Packages:** the platform packages are private. In GitHub → solidvs → Packages →
   `server` and `ui` → *Package settings* → *Manage Actions access*, add the new repository with
   *Read*. Without it, CI cannot install them.
5. **Identity provider:** register the system as a client in Keycloak (realm as code in
   `<organization>/platform`) with redirect URI `https://<host>/api/auth/callback`.
6. **Database:** set the repository variable `DATABASE_ENGINE` (`postgresql`, or `sqlserver`
   where the organization runs SQL Server). A platform administrator creates the database and its
   two logins for each environment with the provisioning procedure of `@solidvs/server`
   (`database/README.md` in the package).
7. **Platform:** create the GitHub environments `<id>-staging` and `<id>-production` in
   `<organization>/platform` with the configuration keys (`PUBLIC_URL`, `OIDC_ISSUER`,
   `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, the database keys of `docs/procedures/deploy.md` and
   the system's own), then follow `docs/procedures/deploy.md`.
8. **Decisions:** date `docs/decisions/0001-use-the-standard-stack.md`; record what this system
   decides on top of the stack.

## Developing

Node.js 24 and pnpm (`corepack enable`). Reading the platform packages needs a GitHub token with
`read:packages` in the user-level `~/.npmrc` (pnpm ignores tokens in the project's `.npmrc`):

```sh
gh auth refresh -h github.com -s read:packages      # once
echo "//npm.pkg.github.com/:_authToken=$(gh auth token)" >> ~/.npmrc
pnpm install
pnpm lint && pnpm build && pnpm typecheck && pnpm test
```

Local run, against the laboratory of `solidvs/kit` (Keycloak + LDAP, with a
PostgreSQL or SQL Server database):

```sh
# in platform-kit (built once with `pnpm install && pnpm build`)
node lab/lab.ts up
node lab/lab.ts database example dev
node lab/lab.ts config example dev --out ../system-template/config.local.json
node lab/lab.ts config example dev --migration --out ../system-template/config.migration.local.json
node lab/lab.ts password ana        # sign in as ana (TI)

# here
pnpm build
pnpm --filter @example/api db:deploy   # migrations, with the migration login
pnpm --filter @example/api db:seed     # synthetic projects
pnpm --filter @example/api dev         # API on :3000, reads config.local.json
pnpm --filter @example/web dev         # web on :5173, /api proxied to the API
```

Any other OIDC provider works too: copy `config.example.json` to `config.local.json` (never
committed) and fill it. For the database alone, `pnpm --filter @example/api db:lab` starts one and
adds its keys to `config.local.json` (`docs/procedures/database.md`).

## Rules

- Every API response has a schema in `packages/contracts`; validate before sending.
- Prisma only in `modules/<module>/infrastructure/` (lint enforces it); every change of data
  records an audit event; every change of the model comes with its migrations for both engines
  (`docs/procedures/database.md`).
- The web app imports the design system only from `@solidvs/ui` (lint enforces it).
- No secret in the repository, image, logs or `config.example.json`. The platform delivers
  configuration as a file at deploy time.
- Third-party releases must be at least 7 days old (`pnpm-workspace.yaml`); platform packages are
  exempt.
