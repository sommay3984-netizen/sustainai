// Cloudflare Pages supports an external-DNS subdomain while the app and D1
// remain on the existing Worker. No DNS delegation for srbros.in is needed.
const backend = 'https://sustainai.sommay3984.workers.dev';
const hosts = new Set(['eco.srbros.in', 'eco-sustainai-srbros.pages.dev']);
export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    if (!hosts.has(incoming.hostname)) return new Response('Unknown host', {status: 404});
    if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('origin') !== incoming.origin) {
      return new Response('Origin check failed', {status: 403});
    }
    const upstream = new URL(backend);
    upstream.pathname = incoming.pathname;
    upstream.search = incoming.search;
    const headers = new Headers(request.headers);
    headers.delete('host');
    for (const name of Array.from(headers.keys())) {
      if (name.startsWith('oai-authenticated-user-')) headers.delete(name);
    }
    if (headers.has('origin')) headers.set('origin', backend);
    try {
      const response = await fetch(new Request(upstream, {
        method: request.method, headers,
        ...(!['GET', 'HEAD'].includes(request.method) ? {body: request.body} : {}),
        redirect: 'manual',
      }));
      const outgoing = new Headers(response.headers);
      const location = outgoing.get('location');
      if (location) {
        const destination = new URL(location, backend);
        if (destination.origin === backend) {
          destination.protocol = incoming.protocol;
          destination.host = incoming.host;
          outgoing.set('location', destination.href);
        }
      }
      return new Response(response.body, {status: response.status, statusText: response.statusText, headers: outgoing});
    } catch {
      return new Response('SustainAI is temporarily unavailable. Please try again.', {status: 502, headers: {'Cache-Control': 'no-store'}});
    }
  },
};
