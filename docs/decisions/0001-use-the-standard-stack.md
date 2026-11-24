# 0001: Use the standard stack

- **Status:** Accepted
- **Date:** <date the system was created>

## Decision

This system is created from `solidvs/template` and follows the standard stack: TypeScript,
NestJS API and React web app in one image, sign-in through the organization's identity provider
(ADR-0009), design system through `@solidvs/ui` (ADR-0011), deploy through `<organization>/platform`
(ADR-0007).

## Consequences

Upgrades of the platform packages arrive as pull requests; the system keeps the template's checks
(lint boundaries, contracts, tests, secret and vulnerability scans) green.
