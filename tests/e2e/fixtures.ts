import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo-fixture@example.invalid',
  app_metadata: {},
  user_metadata: { full_name: 'Fernando', avatar_url: './assets/images/photo-1500648767791-00dcc994a43e.jpg' },
  created_at: '2026-09-09T08:00:00Z',
  email_confirmed_at: '2026-09-09T08:00:00Z',
};

// Every request is intercepted before leaving this disposable browser context.
// No fixture credentials, session, account or mutation reach a real backend.
export const test = base.extend<{ isolatedDemo: void }>({
  isolatedDemo: [async ({ context, baseURL }, use) => {
    if (!baseURL) throw new Error('An isolated local preview is required');
    const previewOrigin = new URL(baseURL).origin;
    if (new URL(baseURL).hostname !== '127.0.0.1') throw new Error('Browser fixtures must only use localhost');
    const document = await context.request.get(baseURL);
    expect(await document.text()).toBe(readFileSync(`${process.env.E2E_DIST_DIR || 'dist'}/index.html`, 'utf8'));
    const state: Record<string, unknown> = {
      'conecta-settings-account-v1': { name: 'Fernando', email: user.email },
    };
    let profile: Record<string, unknown> = { bio: '', profile_visibility: 'public', show_location: true, allow_messages: 'everyone' };
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin === previewOrigin) return route.continue();
      if (!url.hostname.endsWith('.supabase.co')) return route.abort('blockedbyclient');
      const json = (value: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
      if (url.pathname === '/auth/v1/user') return json(user);
      if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204 });
      if (url.pathname === '/auth/v1/token') return json({ access_token: 'isolated-fixture-token', refresh_token: 'isolated-fixture-refresh', token_type: 'bearer', expires_in: 3600, user });
      if (!url.pathname.startsWith('/rest/v1/')) return json({ message: 'Unsupported isolated fixture operation' }, 400);
      const table = url.pathname.split('/').pop();
      const payload = request.postDataJSON();
      if (table === 'prototype_state') {
        if (payload?.state) Object.assign(state, payload.state);
        return json({ state });
      }
      if (table === 'profiles') {
        if (payload) profile = { ...profile, ...payload };
        return json(request.headers().accept?.includes('object') ? profile : [profile]);
      }
      if (request.method() === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': '*/0' } });
      return json([]);
    });
    await context.addInitScript(({ user }) => {
      localStorage.setItem('sb-qdjuypoqiafqncwgmicf-auth-token', JSON.stringify({
        access_token: 'isolated-fixture-token', refresh_token: 'isolated-fixture-refresh',
        token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600, user,
      }));
      localStorage.setItem('conecta-auth-user-v1', user.id);
    }, { user });
    await use();
  }, { auto: true }],
});

export { expect };
