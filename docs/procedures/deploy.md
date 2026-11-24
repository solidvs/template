# Deploy a new version

1. Merge the change into `main`. The `ci` workflow builds, scans and publishes the two images of
   the release, for the installation's engine (repository variable `DATABASE_ENGINE`); its summary
   shows both digests:
   - application: `ghcr.io/solidvs/<system>@sha256:…`;
   - migration step: `ghcr.io/solidvs/<system>/migrate@sha256:…`.
2. In `<organization>/platform`, open a pull request that sets those digests in
   `environments/staging/<system>.compose.yaml` (the application in its service, the migration
   step in the `migrate` service). Merging it deploys to staging: the platform runs the migration
   image once, with the migration login only, and starts the new release only if it succeeds.
3. Check staging (`https://<system>-staging.<zone>`).
4. Open a second pull request copying the same two digests to
   `environments/production/<system>.compose.yaml`. Production only accepts digests that are
   already in staging, and must keep the `migrate` step that staging has.
5. If the new version does not become healthy, the platform returns to the previous one by itself.
   To go back on purpose, revert the pull request.

Variables and secrets: GitHub → `<organization>/platform` → Settings → Environments →
`<system>-staging` / `<system>-production`. A change takes effect on the next deploy (run the
`deploy` workflow by hand for that system and environment).

Database keys (ADR-0016), created by the provisioning procedure:

| Secret or variable | Delivered to |
|---|---|
| `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_PORT`, `DATABASE_TLS_CA` (variables) | both |
| `DATABASE_USER`, `DATABASE_PASSWORD` (application login) | the service only |
| `MIGRATION_DATABASE_USER`, `MIGRATION_DATABASE_PASSWORD` (migration login) | the migration step only, as `DATABASE_USER` and `DATABASE_PASSWORD` |

The platform checks this split: a deploy stops if the migration login is missing, is a variable
instead of a secret, or another `MIGRATION_*` name exists; the job summary lists the names
delivered to each container, never the values. A failed migration starts nothing, and the release
that was running keeps running (`<organization>/platform`, README, "Migrations").

Database changes are not undone by returning to the previous release: a migration that must be
reversed is a new migration.
