# SustainAI — Predict. Simulate. Improve.

Location-aware sustainability app with ten pages, worldwide Photon/OSM search, interactive OpenStreetMap, Open-Meteo weather, CAMS global air quality, provider forecasts, transparent simulations, persistent action plans and goal progress history.

Production runs on Cloudflare Workers with D1. SustainAI accounts use salted PBKDF2 password hashes and opaque server-side sessions in secure HTTP-only cookies. Records are scoped to the signed-in account. Cross-origin writes and changes to foreign records are rejected. Account recovery is not yet available.

No city is preset. Weather and air quality are labeled as model outputs, never live sensors. Data Sources exposes sources, retrieval time, modeled time, geographic resolution and missing evidence. Local water, grid, traffic and biodiversity metrics remain unavailable without user evidence. The score is an illustrative air-quality proxy, not a comprehensive sustainability rating. Simulations use user-entered usage and emission factors, and explicitly state formulas and limitations.

Gemini: set GEMINI_API_KEY in the ignored .dev.vars file for local preview, or as a server-side Sites secret for production. Optional GEMINI_MODEL defaults to gemini-3.8-flash. The AI endpoint refreshes provider data before calling Gemini. It remains visibly unavailable without a key. Never put secrets in browser code.

GEOCODER_URL supports a configurable Photon-compatible service. The default public Photon demo has no SLA. Searches are cached and throttled through D1. Free Open-Meteo access is noncommercial and subject to provider limits; configure licensed services for commercial scale.

Development: Node 22.13+ and pnpm 11.19.0. Run pnpm install --frozen-lockfile, pnpm dev, pnpm build, pnpm exec tsc --noEmit. Generate schema migrations with pnpm db:generate.

On restricted Windows where os.userInfo fails, prefix Node commands with --import ./scripts/windows-runtime.mjs. The helper affects local tooling only.

After the first build, apply the local migration:
node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_blue_nick_fury.sql

scripts/runtime-qa.mjs verifies all routes, exact coordinates, real provider search and forecast retrieval, persistent goal CRUD, missing-record protection and scenario arithmetic. Run with node --experimental-strip-types while local preview is running. It removes its goal fixture. Production authentication and credentialed Gemini calls require production credentials and are not covered by local mock checks.

Usage form: enter any one monthly usage amount; other amounts and carbon factors are optional. Carbon factors are hidden under Advanced details. Missing usage and emission factors remain unknown rather than becoming zero. Scenario plans save only available savings.
