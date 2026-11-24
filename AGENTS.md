# Instructions for AI coding agents

Read `README.md` first. This system follows the standard stack of `solidvs/standard`;
decisions there (`stack/decisions`) and in `docs/decisions` here are binding.

- **Module layout.** New features go in `apps/api/src/modules/<module>/` with `domain/`,
  `application/`, `infrastructure/` and `http/`. Domain code has no framework and no I/O;
  application code depends on the domain only. `pnpm lint` enforces it — never disable the rule.
- **Contracts first.** Add or change the response schema in `packages/contracts`, then the
  controller (`schema.parse(result)` before returning), then the web call (`api(schema, path)`).
- **Every route requires a session** unless it is `@Public()`, which needs a reason in a comment.
  Routes that change data use `@RequireRoles(...)` and are called with the CSRF header (the web
  `api()` helper sends it).
- **Access is declared, not coded:** `access` and `roles` in `app.module.ts`. Department never
  grants a role.
- **User interface:** only `@solidvs/ui`; spacing, colors and type through `token(...)` and the
  primitives (`Box`, `Stack`, `Inline`, `Text`), never raw values. User-facing text in Portuguese.
- **Tests:** one HTTP test per route in `apps/api/src/*.test.ts` style (fake identity provider and
  `TestDataModule` from `@solidvs/server/testing`), unit tests for domain rules.
- **Data (ADR-0016).** Repositories in `modules/<module>/infrastructure/` are the only module code
  that imports Prisma; domain and application see repository interfaces. Change
  `apps/api/prisma/schema.prisma` with engine-neutral types only, then `pnpm db:migration <name>`;
  commit both migrations and the derived SQL Server schema; never edit a merged migration or the
  derived schema. Use cases that change data call `AuditTrail.record` (or the `AuditRecorder` port)
  with `<subject>.<verb>` actions. Seed data is synthetic. HTTP tests use `TestDataModule` and an
  in-memory repository; `pnpm test:db` covers the real database.
- **Configuration:** new keys go in `apps/api/src/config.ts` (schema) and in the platform's GitHub
  environment; never in code, never with values in the repository.
- **Dependencies:** exact versions; third-party releases at least 7 days old.
- Code, comments and technical documentation in English.
