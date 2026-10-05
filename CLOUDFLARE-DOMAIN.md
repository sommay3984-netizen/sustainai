# Subdomain-only configuration

The app remains hosted at https://sustainai.sommay3984.workers.dev.
A Cloudflare Pages entry point forwards the complete app, including account
sessions and saved goals, to this Worker.

Keep the existing Hostinger nameservers for srbros.in. Do NOT use the earlier
Cloudflare nameserver instructions. The pending root-domain zone is unused.

In Hostinger DNS, change only the eco hostname:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | eco | eco-sustainai-srbros.pages.dev |

Remove conflicting A/AAAA/CNAME records for eco only when adding this CNAME.
Keep all root, www, mail and other subdomain records unchanged.

Cloudflare Pages must have eco.srbros.in added under Custom domains before the
CNAME will work. Once DNS validates, Cloudflare provisions HTTPS. Verify login,
logout, map navigation and saved goal updates at https://eco.srbros.in.

The Pages upload package is built from pages-domain/_worker.js and index.html.
Future app updates deploy to the original Worker from GitHub and automatically
appear through the Pages entry point. Redeploy Pages only if its proxy changes.
