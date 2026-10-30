/** Helpers for working with "minutes since midnight" clock times. */

export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Builds a Date carrying `minutes` as its local hour/minute, anchored to `base`'s day. */
export function minutesToDate(minutes: number, base: Date = new Date()): Date {
  const normalized = normalizeMinutes(minutes);
  const result = new Date(base);
  result.setHours(Math.floor(normalized / 60), normalized % 60, 0, 0);
  return result;
}

/** Wraps minutes into the [0, 1440) range, handling negative values and multi-day overflow. */
export function normalizeMinutes(minutes: number): number {
  return ((Math.round(minutes) % 1440) + 1440) % 1440;
}

/** Formats minutes-since-midnight as a 12-hour clock label, e.g. "10:30 PM". */
export function formatMinutes(minutes: number): string {
  const normalized = normalizeMinutes(minutes);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
}

/** Formats a Date as a "YYYY-MM-DD" key using its local calendar date. */
export function toDateKey(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a "YYYY-MM-DD" key into a local Date at midnight. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map((part) => parseInt(part, 10));
  return new Date(year, month - 1, day);
}

/** Returns a new Date `days` calendar days after `date` (negative goes back). */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Formats a date as a short label, e.g. "Mon Nov 7". */
export function formatShortDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday} ${month} ${date.getDate()}`;
}
