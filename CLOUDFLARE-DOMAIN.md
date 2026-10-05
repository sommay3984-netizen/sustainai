# SustainAI production domain

The app is live at https://sustainai.sommay3984.workers.dev.
Cloudflare has a production custom-domain binding for `eco.srbros.in`.
The `srbros.in` DNS zone is pending activation until the domain owner updates
the authoritative nameservers at Hostinger.

Before switching nameservers, compare the imported DNS records in Cloudflare
against the complete Hostinger DNS zone and copy any missing custom records.
The scanner found 15 existing records, including the main website, FTP,
Hostinger mail MX, DKIM, SPF and DMARC. These imported records are DNS-only.
The scanner cannot guarantee that every existing subdomain was discovered.

In Hostinger's domain management for `srbros.in`, replace the current
`orbit.dns-parking.com` and `horizon.dns-parking.com` nameservers with:

- `kobe.ns.cloudflare.com`
- `meadow.ns.cloudflare.com`

This moves authoritative DNS for the entire `srbros.in` domain to Cloudflare;
the registration and existing website hosting remain at Hostinger. Make this
change only after checking the imported records. The `eco` custom domain is
managed by Cloudflare Workers; do not create a CNAME to the workers.dev URL.

After Cloudflare reports the zone active and its HTTPS certificate is ready,
verify https://eco.srbros.in, including sign-in and saved goal updates.
Username/password sign-in remains the configured authentication method.
