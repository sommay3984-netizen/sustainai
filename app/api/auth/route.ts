import { authDatabase, cookieValue, equalHash, hex, passwordHash, sessionToken, tokenHash } from '../../../lib/session';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status = 200, cookie?: string) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Origin check failed.' }, 403);
    const text = await request.text();
    if (text.length > 4096) return reply({ error: 'Request too large.' }, 413);
    const input = JSON.parse(text);
    const db = authDatabase();
    if (input.op === 'logout') {
      const token = sessionToken(request.headers.get('cookie'));
      if (token) await db.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await tokenHash(token)).run();
      return reply({ ok: true }, 200, cookieValue('', 0));
    }
    if (!['login', 'register'].includes(input.op) || typeof input.username !== 'string' || typeof input.password !== 'string') return reply({ error: 'Invalid request.' }, 400);
    const username = input.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(username) || input.password.length < 12 || input.password.length > 128) return reply({ error: 'Use a 3–32 character username (letters, numbers, underscores) and a 12–128 character password.' }, 400);
    // Use Cloudflare's request IP, never a client-supplied forwarded header.
    const key = await tokenHash(request.headers.get('cf-connecting-ip') || 'local');
    const now = Date.now();
    const limit = await db.prepare('INSERT INTO auth_limits (key, count, reset) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN reset < ? THEN 1 ELSE count + 1 END, reset = CASE WHEN reset < ? THEN excluded.reset ELSE reset END RETURNING count').bind(key, now + 600000, now, now).first<{ count: number }>();
    if (!limit || limit.count > 15) return reply({ error: 'Too many sign-in attempts. Try again in ten minutes.' }, 429);
    let user = await db.prepare('SELECT id, username, salt, password_hash FROM auth_users WHERE username = ?').bind(username).first<{ id: string; username: string; salt: string; password_hash: string }>();
    if (input.op === 'register') {
      if (user) return reply({ error: 'That username is unavailable.' }, 409);
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      const id = crypto.randomUUID();
      const hash = await passwordHash(input.password, salt);
      try { await db.prepare('INSERT INTO auth_users (id, username, salt, password_hash) VALUES (?, ?, ?, ?)').bind(id, username, salt, hash).run(); }
      catch { return reply({ error: 'Unable to create the account. Try another username.' }, 409); }
      user = { id, username, salt, password_hash: hash };
    } else {
      const hash = await passwordHash(input.password, user?.salt || 'missing-user-fixed-salt');
      if (!user || !equalHash(hash, user.password_hash)) return reply({ error: 'Incorrect username or password.' }, 401);
    }
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    await db.prepare('DELETE FROM auth_sessions WHERE expires < ?').bind(now).run();
    await db.prepare('INSERT INTO auth_sessions (token_hash, user_id, expires) VALUES (?, ?, ?)').bind(await tokenHash(token), user.id, now + 2592000000).run();
    return reply({ ok: true }, 200, cookieValue(token));
  } catch { return reply({ error: 'Account service is temporarily unavailable.' }, 503); }
}
