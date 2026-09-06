# Security Fixes — Setup Checklist

This lists every manual step needed to activate the code changes. Nothing
here works automatically just by deploying — each item below needs to be
done once in Supabase / Vercel / Telegram.

## 1. Database migration (required)

Run `supabase-migration-security-fixes.sql` in the Supabase SQL Editor.
This adds the `attempts` column to `password_resets`, used by the new
OTP brute-force lockout (5 tries, then the code is invalidated).

Without this column, `reset-password-otp` and `verify-password-otp` will
error on every request — do this before deploying.

## 2. `CRON_SECRET` (required)

- If you don't already have one, generate a random secret, e.g.:
  ```
  openssl rand -hex 32
  ```
- Add it as `CRON_SECRET` in your Vercel project's Environment Variables
  (Production + Preview).
- Vercel Cron jobs (the ones defined in `vercel.json`) automatically send
  `Authorization: Bearer $CRON_SECRET` when `CRON_SECRET` is set as an env
  var on the project — no extra config needed there.
- **Every cron route now requires this** (`daily-summary`, `weekly-summary`,
  `monthly-summary`, `telegram-daily-summary`, `telegram-weekly-summary`,
  `telegram-monthly-summary`, `reminder`, `monthly-reminder`,
  `telegram-engagement`, `retention`). If you trigger any of these from an
  external scheduler (not Vercel Cron), make sure it sends the same header.

## 3. Telegram webhook secret token (required for the Telegram bot to keep working)

- Generate a random secret, e.g. `openssl rand -hex 24`.
- Add it as `TELEGRAM_WEBHOOK_SECRET` in your env vars.
- Re-register your Telegram webhook with that secret so Telegram starts
  sending it back on every request:
  ```
  curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<your-public-telegram-webhook-url>&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
  ```
- **Until you do this, `/api/telegram` will reject every incoming message**
  (fails closed, by design) — do this at the same time you deploy.

## 4. Twilio webhook URL (required for the WhatsApp bot to keep working)

- Set `NEXT_PUBLIC_WEBHOOK_BASE_URL` to the exact public HTTPS URL Twilio
  is configured to POST WhatsApp messages to, e.g.
  `https://brofinai.com/api/whatsapp` — must match exactly what's
  configured in the Twilio console (no trailing slash, correct scheme).
- If this isn't set, the code falls back to
  `${NEXT_PUBLIC_WEBSITE_URL}/api/whatsapp`, which only works if that
  happens to be the exact webhook URL already.
- **Until this matches exactly, `/api/whatsapp` will reject every incoming
  message** (fails closed, by design) — double check this in a staging
  environment before relying on it in production, since a mismatch here
  (not the attack this is meant to stop) is the most likely way to
  accidentally break the bot.

## 5. Supabase Auth password policy (recommended, dashboard-only)

The app now enforces "8+ chars, letters + numbers" in the register form
and in both password-reset API routes. For full coverage, also set a
minimum password strength/length in Supabase: **Authentication → Policies
→ Password Requirements** (exact location depends on your Supabase
dashboard version). This covers any path that calls Supabase Auth
directly and isn't already covered by the app's own checks.

## 6. Row Level Security review (recommended, dashboard-only)

Several pages/routes query `users`, `password_resets`, and `transactions`
directly with the anon key from the browser. Confirm RLS policies on
these tables only allow the minimum necessary access (e.g. a user should
not be able to `select *` on the `users` table via the anon key beyond
what the login/registration flows strictly need).

## 7. `npm install`

`xlsx` was removed from `package.json` (it was unused and carried an
unpatched high-severity CVE). Run `npm install` to update
`node_modules`/`package-lock.json` after pulling these changes.

---

### Quick reference: new/changed env vars

| Variable | Required? | Purpose |
|---|---|---|
| `CRON_SECRET` | Yes (all cron routes now enforce it) | Bearer token for `/api/cron/*` |
| `TELEGRAM_WEBHOOK_SECRET` | Yes (for Telegram bot to function) | Verifies Telegram webhook requests |
| `NEXT_PUBLIC_WEBHOOK_BASE_URL` | Recommended | Exact WhatsApp webhook URL, used for Twilio signature validation |
