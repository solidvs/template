# Two images per release, built from the same sources (stack proposal, section 3; ADR-0016):
# - the application (default target): the API serves /api and the web app on the same origin;
# - the migration step (`--target migrate`): `prisma migrate deploy` with the migration login, run
#   once by the platform before the new release starts.
# DATABASE_ENGINE chooses the engine the Prisma client is generated for: postgresql (reference) or
# sqlserver. Base images pinned by digest; dependencies installed from the lockfile only.

ARG DATABASE_ENGINE=postgresql

FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS build
ARG DATABASE_ENGINE
ENV DATABASE_ENGINE=${DATABASE_ENGINE}
WORKDIR /src
RUN corepack enable
COPY . .
# The GitHub Packages token is a build secret, written to a user npmrc on a tmpfs that exists only
# while the command runs: it never lands in a layer.
RUN --mount=type=secret,id=npm_token --mount=type=tmpfs,target=/run/npmauth \
    printf '//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/npm_token)" > /run/npmauth/npmrc \
 && NPM_CONFIG_USERCONFIG=/run/npmauth/npmrc pnpm install --frozen-lockfile
RUN pnpm build
RUN --mount=type=secret,id=npm_token --mount=type=tmpfs,target=/run/npmauth \
    printf '//npm.pkg.github.com/:_authToken=%s\n' "$(cat /run/secrets/npm_token)" > /run/npmauth/npmrc \
 && NPM_CONFIG_USERCONFIG=/run/npmauth/npmrc pnpm --filter @example/api deploy --prod --legacy /out \
 && cp -r apps/web/dist /out/public \
 && NPM_CONFIG_USERCONFIG=/run/npmauth/npmrc pnpm --filter @example/migrate deploy --prod --legacy /migrate \
 && cp -r apps/api/prisma apps/api/prisma.config.ts /migrate/
# The Prisma CLI fetches its schema engine (pinned by @prisma/engines-version) on first use; fetch
# it now, so the migration image needs no network.
RUN cd /migrate && CHECKPOINT_DISABLE=1 node node_modules/prisma/build/index.js version > /dev/null

FROM node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS runtime-base
ENV NODE_ENV=production
# The runtime needs node only. The package managers shipped with the base image (npm, corepack,
# yarn) are removed: they are never used in production and carry their own vulnerabilities.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*
WORKDIR /app

# Migration step: reads the migration login from /run/secrets/config (DATABASE_* keys only).
FROM runtime-base AS migrate
ARG DATABASE_ENGINE
# No update check and no telemetry from the CLI: the migration step talks to the database only.
ENV DATABASE_ENGINE=${DATABASE_ENGINE} PRISMA_HIDE_UPDATE_MESSAGE=1 CHECKPOINT_DISABLE=1
COPY --from=build --chown=root:root /migrate ./
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# Application: reads its configuration, with the application login, from /run/secrets/config.
FROM runtime-base AS app
ARG DATABASE_ENGINE
ENV DATABASE_ENGINE=${DATABASE_ENGINE}
COPY --from=build --chown=root:root /out ./
# Runs as an unprivileged user on a read-only filesystem (the platform adds read_only and tmpfs).
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
