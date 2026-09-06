-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Adds the attempt counter used by the new OTP brute-force lockout in
-- /api/reset-password-otp and /api/verify-password-otp.

alter table public.password_resets
  add column if not exists attempts integer not null default 0;

-- Optional but recommended: automatically clean up stale/expired rows so
-- the table doesn't accumulate old OTPs forever. Safe to run manually
-- every so often, or wire up as a pg_cron job if your Supabase plan
-- supports pg_cron.
-- delete from public.password_resets where created_at < now() - interval '1 day';
