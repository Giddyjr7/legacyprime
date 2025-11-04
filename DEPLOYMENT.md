Deployment checklist

1) Vercel (Frontend)

- Set environment variable:
  VITE_API_BASE_URL = https://legacyprime.onrender.com/api

  In Vercel dashboard: Project -> Settings -> Environment Variables -> Add
  (set for Production)

- If your frontend is served from a different Vercel URL, set:
  VERCEL_FRONTEND_ORIGIN = https://<your-vercel-domain>

- Build & deploy. The frontend will use the configured VITE_API_BASE_URL at build time.

2) Render (Backend)

- Ensure environment variables are set on Render:
  - DJANGO_SECRET_KEY
  - SENDGRID_API_KEY
  - DEFAULT_FROM_EMAIL=noreply@legacyprime.com
  - DJANGO_DEBUG=False
  - CORS_ALLOWED_ORIGINS (optional override)
  - RENDER_EXTERNAL_HOSTNAME (optional)

- Ensure `EMAIL_BACKEND` is set to the SendGrid backend or left as default in settings.

3) CORS & CSRF

- The backend already includes `corsheaders` in `INSTALLED_APPS` and `CorsMiddleware` at the top of `MIDDLEWARE`.
- `CORS_ALLOW_CREDENTIALS = True` is set. Keep it enabled if you rely on session cookies.
- `CORS_ALLOW_ALL_ORIGINS = False` is enforced. Add the frontend origin(s) to `CORS_ALLOWED_ORIGINS`.
- Add the frontend origin to `CSRF_TRUSTED_ORIGINS` when using secure cookies and HTTPS.

4) Quick tests

- Curl test to inspect CORS & response headers (PowerShell example):

```powershell
$payload = '{ "username": "testuser", "email": "you@domain.com", "password": "StrongPass123!", "password2": "StrongPass123!" }'
curl -i -X POST https://legacyprime.onrender.com/api/accounts/register/ `
  -H "Content-Type: application/json" `
  -H "Origin: https://legacyprime-frontend.vercel.app" `
  -d $payload
```

- Check the response status and headers. Expected headers include `Access-Control-Allow-Origin: https://legacyprime-frontend.vercel.app` (or `*`) and `Access-Control-Allow-Credentials: true` if credentials are involved.

- Browser test: Open DevTools -> Network. Submit registration on the frontend. Confirm POST to `/api/accounts/register/` returns HTTP 200 (or 400) with JSON body `{ "message": "...", "email": "..." }`.

5) Debug endpoint

- A small debug endpoint was added to the backend at `/api/notifications/debug/cors/` (GET). It returns JSON with the request origin and method. Use it to verify the frontend-origin is visible to the backend.

6) If you still see `Network error` in the frontend

- Confirm Vercel's build used the correct `VITE_API_BASE_URL` (check Build Logs or Environment Variables in Vercel settings).
- Confirm the browser console's network tab: is the request being blocked by CORS preflight (OPTIONS) or by failed TLS/mixed-content? If so, paste the request/response details and I can diagnose further.
- Ensure frontend requests include credentials when using cookies: the frontend `fetch` wrapper sets `credentials: 'include'` already.

If you want, I can add more detailed logging in `RegisterView.post` (include a request id and sanitized payload logs) or create a simple endpoint that returns headers for CORS troubleshooting. Tell me which and I'll implement it.
