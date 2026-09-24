# Auth-Gated App Testing Playbook (GroovLabz)

Google sign-in uses Emergent-managed OAuth. The real Google redirect cannot be automated; test with a seeded session instead.

## Step 1: Create test user & session (mongosh)
use DB_NAME from /app/backend/.env
```
var userId = 'google-test-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({ id: userId, email: 'test.google.' + Date.now() + '@example.com', name: 'Google Tester', picture: 'https://via.placeholder.com/150', role: 'user', auth_provider: 'google', created_at: new Date().toISOString() });
db.user_sessions.insertOne({ user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date() });
```

## Step 2: Backend
- `GET /api/auth/me` with `Authorization: Bearer <sessionToken>` → 200 user (session-token fallback path).
- `GET /api/auth/me` with cookie `session_token=<sessionToken>` → 200.
- Expired session (expires_at in the past) → 401 "Session expired".
- `POST /api/auth/google/session` with header `X-Session-ID: bogus` → 401.

## Step 3: Browser
- Set cookie `session_token` (httpOnly, secure, sameSite None, domain = preview host) and also `localStorage.gl_token = <sessionToken>`; open `/account` → dashboard renders, no redirect.
- `/login` shows `google-signin-button`; clicking navigates to `https://auth.emergentagent.com/?redirect=<origin>/account` (assert URL only, then go back).
- Visiting `/account#session_id=fake123` renders `auth-callback`, then redirects to `/login` with an error toast (backend 401).

## Cleanup
```
db.users.deleteMany({ email: /test\.google\./ });
db.user_sessions.deleteMany({ session_token: /test_session/ });
```
