# Hostinger deployment notes

## Fixing the reported pnpm build error

Use the latest `main` branch. `pnpm-workspace.yaml` now sets
`confirmModulesPurge: false` so pnpm can recreate dependencies without a
terminal prompt. pnpm 11 reads this setting from the workspace YAML.

In Hostinger's deployment environment variables, add `CI` with value `true`
before dependency installation, then retry the deployment. Use Node.js 22.13
or newer and pnpm 11.19.0, with `pnpm install --frozen-lockfile` and
`pnpm run build`.

Do not upload `node_modules`, `.dev.vars`, `.env` secrets, or `.wrangler`.
Let the build platform install dependencies from the lockfile.

## Runtime requirements

This repository currently builds a Cloudflare Worker and uses Cloudflare D1
for account sessions and saved goals. It imports `cloudflare:workers` and
requires a `DB` binding. Fixing the pnpm prompt does not convert this runtime
to Hostinger PHP/MySQL or a conventional Node.js server.

Standard Web/WordPress hosting with FTP cannot run this build directly. A full
Hostinger deployment needs a backend and database migration, or a compatible
Worker runtime with D1 access. No Hostinger migration is included in this fix.

## Goals

The Home active-goal count covers every saved location in the signed-in
account. Completed goals are excluded. Signed-out, loading, and load-failure
states no longer display a misleading zero. Goals are personal targets;
create them and enter progress on the Goals page.
