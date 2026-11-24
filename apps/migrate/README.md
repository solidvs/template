# Migration image

Dependencies of the second image of each release (ADR-0016, item 6): `prisma migrate deploy` with
the migration login, run once by the platform before the new release starts. The Dockerfile copies
`apps/api/prisma` and `apps/api/prisma.config.ts` next to these dependencies (`--target migrate`).
The application image has neither the Prisma CLI nor the migration credential.
