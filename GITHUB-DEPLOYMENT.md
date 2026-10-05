# Cloudflare deployment from GitHub

Build command: `pnpm build`
Deploy command: `pnpm exec wrangler deploy --config dist/server/wrangler.json`
Production branch: `main`
Preview builds: disabled (previews must not share production database).

The Vite configuration names the Worker `sustainai` and binds `DB` to the provisioned `sustainai-db` D1 database. The database schema is in `drizzle/`. Authentication uses SustainAI accounts and secure HTTP-only session cookies, with incoming Sites identity headers stripped. Set GEMINI_API_KEY through Cloudflare's server-side secrets when the provider project has access. No credentials are committed.
