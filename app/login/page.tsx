'use client';
import { useState } from 'react';
export default function Login() {
  const [register, setRegister] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: register ? 'register' : 'login', username: form.get('username'), password: form.get('password') }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error);
      window.location.assign('/profile');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.'); } finally { setBusy(false); }
  }
  return <section className="card" style={{ maxWidth: 460, margin: '40px auto' }}><h1>{register ? 'Create your SustainAI account' : 'Sign in to SustainAI'}</h1><p>Save your locations, goals, and plans across devices.</p><form onSubmit={submit}><label>Username<input name="username" autoComplete="username" required pattern="[a-zA-Z0-9_]{3,32}" minLength={3} maxLength={32} /></label><label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={12} maxLength={128} /></label><p>Passwords need at least 12 characters. Keep your credentials safe; password recovery is not available yet.</p>{error && <p role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button></form><button className="secondary" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section>;
}

