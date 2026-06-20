---
name: setup-ta-admin
description: Use when setting up or resetting the third-audience-mdx dashboard admin login — initialises the admin password store, generates the API key, wires login and api-key routes, adds the middleware auth guard, and prints credentials
---

# Setup Third Audience Admin Login

Secure the `/third-audience/` dashboard with a login page and cookie-based session, and generate an API key for headless/external callers.

Default password: `Chang3M3Now!` — the user **must** change it on first login.
API key: generated automatically, shown once, stored AES-256-GCM encrypted.

## What this sets up

- `data/ta-admin.json` — hashed password + encrypted API key (never commit)
- `/third-audience/login` — login page, cookie-based session
- `/third-audience/settings` — shows masked API key, copy button, rotate button
- `/api/third-audience/api-key` — GET (masked key) / POST rotate
- Middleware auth guard — redirects unauthenticated browser requests to `/login`
- `X-TA-Api-Key` header auth — for headless/external API callers
- Force-reset flow — first login with default password → redirect to password change form
- Red warning banner on dashboard until default password is changed

## Checklist

1. **Check if already set up** — look for `data/ta-admin.json`, login route, api-key route
2. **Add login route** — `app/api/third-audience/login/route.ts`
3. **Add api-key route** — `app/api/third-audience/api-key/route.ts`
4. **Add settings page** — `app/third-audience/settings/page.tsx`
5. **Confirm middleware** — `thirdAudienceMiddleware` handles auth guard internally
6. **Initialise admin store** — run init script; prints default password + API key
7. **Update .gitignore** — add `data/ta-admin.json`
8. **Print credentials** — show user everything they need
9. **Verify** — curl dashboard (expect 302), login page (expect 200), API key endpoint (expect 401 without key)

---

## Step 1 — Check if already set up

```bash
ls data/ta-admin.json 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
ls app/api/third-audience/login/route.ts 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
ls app/api/third-audience/api-key/route.ts 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
```

If `data/ta-admin.json` exists, the admin store is already initialised — skip Step 6 and just remind the user of URLs. Still create any missing route files.

---

## Step 2 — Add login route

Create `app/api/third-audience/login/route.ts`:

```ts
export { GET, POST } from 'third-audience-mdx/routes/login'
```

---

## Step 3 — Add api-key route

Create `app/api/third-audience/api-key/route.ts`:

```ts
export { GET, POST } from 'third-audience-mdx/routes/api-key'
```

---

## Step 4 — Add settings page

Create `app/third-audience/settings/page.tsx`:

```tsx
import { SettingsPage } from 'third-audience-mdx/dashboard/ui/pages/SettingsPage'
import { getApiKey } from 'third-audience-mdx/dashboard/admin-store'

export const dynamic = 'force-dynamic'

export default function Page() {
  const key = getApiKey()
  const masked = key
    ? key.slice(0, 8) + '••••••••••••••••••••••••••••••••••••••' + key.slice(-4)
    : null
  return <SettingsPage maskedKey={masked} />
}
```

---

## Step 5 — Confirm middleware

Read `middleware.ts`. It must import `thirdAudienceMiddleware` from `third-audience-mdx` — the auth guard, login rewrite, and API key verification are all built in.

```ts
export { thirdAudienceMiddleware as middleware } from 'third-audience-mdx'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

If the user has custom middleware, confirm `thirdAudienceMiddleware(request)` is called first and its response returned when non-null.

---

## Step 6 — Initialise the admin store

Run via the package (preferred if `dist/` exists):

```bash
node -e "
const { initAdmin } = require('./node_modules/third-audience-mdx/dist/dashboard/admin-store.js');
const result = initAdmin();
if (result.isNew) {
  console.log('Password: ' + result.password);
  console.log('API key:  ' + result.apiKey);
} else {
  console.log('Admin store already exists — no changes made.');
}
"
```

**If `dist/` does not exist** (package not yet built), create `data/ta-admin.json` manually:

```bash
node -e "
const crypto = require('crypto');
const fs = require('fs');

const secret = process.env.THIRD_AUDIENCE_SECRET || 'ta-salt';

// Hash password
const password = 'Chang3M3Now!';
const passwordHash = crypto.createHash('sha256').update(secret + password).digest('hex');

// Generate + encrypt API key
const apiKeyPlain = 'ta_' + crypto.randomBytes(24).toString('hex');
const encKey = crypto.createHash('sha256').update(secret).digest();
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
const encrypted = Buffer.concat([cipher.update(apiKeyPlain, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
const apiKeyEncrypted = iv.toString('hex') + tag.toString('hex') + encrypted.toString('hex');

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/ta-admin.json', JSON.stringify({
  passwordHash,
  isDefaultPassword: true,
  createdAt: new Date().toISOString(),
  lastLoginAt: null,
  apiKey: apiKeyEncrypted
}, null, 2));

console.log('Created data/ta-admin.json');
console.log('Password: Chang3M3Now!');
console.log('API key:  ' + apiKeyPlain);
console.log('');
console.log('Copy the API key now — it cannot be retrieved later without rotating.');
"
```

**Save the printed API key** — it is stored encrypted and cannot be read back. If lost, rotate it from `/third-audience/settings`.

---

## Step 7 — Update .gitignore

Add to `.gitignore`:

```
data/ta-admin.json
```

This file contains the hashed password and encrypted API key — never commit it.

---

## Step 8 — Print credentials

Tell the user clearly:

```
✅ Third Audience admin is set up.

Dashboard:      http://localhost:3000/third-audience/
Login:          http://localhost:3000/third-audience/login
Settings:       http://localhost:3000/third-audience/settings

Default password: Chang3M3Now!
API key: ta_<shown above — copy it now>

⚠️  On first login you will be forced to set a new password.
   The dashboard shows a red warning banner until you do.

To call the API from external tools:
  curl https://yoursite.com/api/third-audience/analytics \
    -H "X-TA-Api-Key: ta_your_key_here"

To rotate the API key: visit /third-audience/settings → Rotate API key.
```

---

## Step 9 — Verify

```bash
# Dashboard should redirect to login (302, not 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/third-audience/

# Login page should load (200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/third-audience/login

# Analytics API without key should return 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/third-audience/analytics

# Analytics API with key should return 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/third-audience/analytics \
  -H "X-TA-Api-Key: ta_your_key_here"
```

Expected: `302`, `200`, `401`, `200`. Report any that don't match.

---

## Security notes

- `data/ta-admin.json` — never committed; contains hashed password + AES-256-GCM encrypted API key
- Password hashed with SHA-256 keyed on `THIRD_AUDIENCE_SECRET` — changing the secret invalidates stored hash
- API key encrypted with AES-256-GCM keyed on `THIRD_AUDIENCE_SECRET` — same caveat
- `X-TA-Api-Key` verification uses `crypto.timingSafeEqual` — not vulnerable to timing attacks
- Session cookie is `HttpOnly; SameSite=Strict; secure` (in production) — not readable by JS
- Session signed with HMAC-SHA256 — stateless, no database required
- Sessions expire after 8 hours
- Default password `Chang3M3Now!` is universally known — force-reset ensures it cannot remain in place
- API key is shown exactly once (at generation or rotation) — if lost, rotate from settings
