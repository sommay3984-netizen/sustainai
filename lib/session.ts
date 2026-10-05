import { env } from 'cloudflare:workers';

export const SESSION_COOKIE = '__Host-sustainai_session';
export function authDatabase(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error('Account storage is unavailable.');
  return db;
}
export function hex(bytes: ArrayBuffer | Uint8Array) {
  return Array.from(new Uint8Array(bytes)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function tokenHash(token: string) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
}
export async function passwordHash(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100000 }, key, 256));
}
export function equalHash(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
export function sessionToken(cookie: string | null) {
  const token = cookie?.split(';').map(c => c.trim()).find(c => c.startsWith(SESSION_COOKIE + '='))?.slice(SESSION_COOKIE.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function sessionUser(cookie: string | null) {
  const token = sessionToken(cookie);
  if (!token) return null;
  const row = await authDatabase().prepare('SELECT u.id, u.username FROM auth_sessions s JOIN auth_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires > ?').bind(await tokenHash(token), Date.now()).first<{ id: string; username: string }>();
  return row ? { userId: row.id, displayName: row.username, email: '', fullName: row.username } : null;
}
export function cookieValue(token: string, maxAge = 60 * 60 * 24 * 30) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
