// ---------------------------------------------------------------------------
// BUG THIS FIXES: both daily-summary cron routes (WhatsApp + Telegram) used
// to compute "today start" as:
//
//   const todayStart = new Date();
//   todayStart.setHours(0, 0, 0, 0);
//
// That zeroes the clock in the SERVER's own timezone (Vercel functions run
// in UTC), not the user's timezone. For a user ahead of UTC — e.g. Asia/Colombo
// (UTC+5:30) — local midnight actually happens 5:30 EARLIER than UTC midnight.
// So every transaction logged in the first ~5:30 of the user's day (e.g. a
// 12:28 AM entry) had a `created_at` still before the server's "todayStart",
// and got silently excluded from that day's `.gte("created_at", todayStart)`
// query — the 9 PM summary would show 0 income / 0 expense even though real
// transactions were logged earlier that same local day.
//
// getStartOfTodayInTimezone() below finds the correct UTC instant instead,
// per-user, using each user's own IANA timezone.
// ---------------------------------------------------------------------------

/**
 * Returns the UTC Date instant corresponding to local midnight on the given
 * Y-M-D (numbered as in JS Date: month is 0-11), as seen in `timeZone`. Safe
 * for any timezone, including fractional-hour offsets and ones behind UTC.
 */
function getZonedMidnightUtc(year: number, month: number, day: number, timeZone: string): Date {
  const ymd = `${year.toString().padStart(4, "0")}-${(month + 1).toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;

  // First guess: treat that Y-M-D as if it were already midnight UTC.
  const guess = new Date(`${ymd}T00:00:00Z`);

  // See what wall-clock time `guess` actually reads as inside timeZone. If
  // timeZone is ahead of UTC, this will show some time AFTER 00:00 (e.g.
  // 05:30 for +5:30) — that gap is exactly how far our guess overshot true
  // local midnight, so we subtract it back out.
  const shown = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(guess);

  const [hh, mm, ss] = shown.split(":").map((n) => parseInt(n, 10));
  let offsetMs = ((hh % 24) * 60 * 60 + mm * 60 + ss) * 1000;
  // Timezones behind UTC (e.g. America/New_York) can show a time in the
  // 12–23h range that actually means "yesterday, that many hours before
  // midnight" — wrap it to a signed offset within +/-12h either way.
  if (offsetMs > 12 * 60 * 60 * 1000) offsetMs -= 24 * 60 * 60 * 1000;

  return new Date(guess.getTime() - offsetMs);
}

/**
 * Returns the UTC Date instant corresponding to local midnight "today", as
 * seen in `timeZone` (an IANA name, e.g. "Asia/Colombo").
 */
export function getStartOfTodayInTimezone(timeZone: string): Date {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  return getZonedMidnightUtc(y, m - 1, d, timeZone);
}

/**
 * Returns the UTC Date instant corresponding to local midnight on the 1st of
 * the current month, as seen in `timeZone`. Same class of bug as
 * getStartOfTodayInTimezone (see the note above), just at month scale — the
 * monthly-summary crons used to build `firstDayOfMonth` from the server's
 * own local Y-M, which silently dropped the first few hours of the month's
 * transactions for any user ahead of the server's UTC clock.
 */
export function getStartOfMonthInTimezone(timeZone: string): Date {
  const now = new Date();
  const ym = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).format(now); // "YYYY-MM"
  const [y, m] = ym.split("-").map((n) => parseInt(n, 10));
  return getZonedMidnightUtc(y, m - 1, 1, timeZone);
}

/** True when it's currently 9 PM local time in `timeZone`. */
export function is9PMInTimezone(timeZone: string): boolean {
  try {
    const now = new Date();
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      hour12: false,
    }).format(now);
    return parseInt(hourStr, 10) === 21;
  } catch (err) {
    console.error(`Invalid timezone: ${timeZone}`, err);
    return false;
  }
}
