# GitHub publication

The included GitHub Actions workflow checks TypeScript and builds the Cloudflare Worker. It does not deploy a website.

This app cannot run on GitHub Pages: it requires server routes, Cloudflare D1, and authenticated user identity. The current identity implementation trusts headers injected by Sites hosting; deploying directly to an ordinary Worker requires replacing that integration with verified authentication, stripping any incoming identity headers, and configuring the sign-in routes. Do not publish an ordinary Worker with the existing identity headers trusted.

For the full application, either retain Sites hosting or finish the authentication adaptation and connect a Cloudflare hosting account with a D1 database. Apply the included drizzle migration before using persistent records. Configure Gemini only as a server-side secret. No local credentials are included in this source archive.
