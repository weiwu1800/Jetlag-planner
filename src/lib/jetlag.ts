import { addDays, fromDateKey, toDateKey } from './time';
import { ProfileType, TravelerProfile, Trip } from './types';

export type Direction = 'eastward' | 'westward' | 'none';
export type Tier = 1 | 2 | 3 | 4 | 5;

/** All times are minutes since midnight (may fall outside [0, 1440) before formatting). */
export interface DayPlan {
  /** 1 = three days before departure, 3 = the night before. */
  day: 1 | 2 | 3;
  date: Date;
  dateKey: string;
  /** Signed minutes this day's schedule is shifted from the normal routine. */
  shiftMinutes: number;
  bedtimeMinutes: number;
  wakeTimeMinutes: number;
  morningLightMinutes: number;
  eveningDimMinutes: number;
  screensOffMinutes: number;
  breakfastMinutes: number;
  lunchMinutes: number;
  dinnerMinutes: number;
  caffeineCutoffMinutes: number;
  exerciseMinutes: number;
}

export interface JetLagPlan {
  direction: Direction;
  /** Destination offset minus home offset, in hours. Positive = eastward. */
  offsetDiffHours: number;
  tier: Tier;
  /** Unsigned minutes the schedule moves per prep day for this traveler. */
  perDayShiftMinutes: number;
  /** Tier summary shown above the day cards (or instead of them for tier 1). */
  message: string | null;
  /** Extra caveat for very large gaps. */
  note: string | null;
  /** Every prep day in the plan, regardless of whether it has already passed. */
  days: DayPlan[];
}

/**
 * Returns the UTC offset of `timeZone` on `date`, in minutes, accounting for DST.
 * e.g. America/Los_Angeles in winter returns -480 (UTC-8).
 */
export function getTimezoneOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  // Some ICU implementations report midnight as hour "24" in 24-hour mode.
  const hour = map.hour === '24' ? 0 : parseInt(map.hour, 10);

  const asUTC = Date.UTC(
    parseInt(map.year, 10),
    parseInt(map.month, 10) - 1,
    parseInt(map.day, 10),
    hour,
    parseInt(map.minute, 10),
    parseInt(map.second, 10)
  );

  return Math.round((asUTC - date.getTime()) / 60000);
}

/**
 * Hours from home to destination on `date` (destOffset - homeOffset).
 * Positive = eastward (advance clock, sleep earlier); negative = westward
 * (delay clock, sleep later). Evaluated on the actual departure date so DST is
 * correct for the trip rather than for today.
 *
 * Sanity checks:
 *   Pacific (Nov, PST UTC-8) → London (Nov, GMT UTC+0):   0 - (-8) = +8 hrs east
 *   Pacific (Nov, PST UTC-8) → Shanghai (Nov, CST UTC+8): 8 - (-8) = +16 hrs east
 * Note the US and EU switch DST on different weekends, so for a departure in
 * the last week of October / first week of November, Pacific → London is 7 hrs.
 */
export function getOffsetDiffHours(homeTimezone: string, destinationTimezone: string, date: Date): number {
  const homeOffset = getTimezoneOffsetMinutes(homeTimezone, date);
  const destOffset = getTimezoneOffsetMinutes(destinationTimezone, date);
  return (destOffset - homeOffset) / 60;
}

/**
 * Gap boundaries: 0–2 hrs → 1, 3 → 2, 4–6 → 3, 7–9 → 4, 10+ → 5.
 * Half-hour zones (e.g. India) stay in the lower tier until the next whole hour.
 */
export function tierForGap(gapHours: number): Tier {
  if (gapHours < 3) return 1;
  if (gapHours < 4) return 2;
  if (gapHours < 7) return 3;
  if (gapHours < 10) return 4;
  return 5;
}

const SHIFT_MINUTES_BY_TIER: Record<Tier, Record<ProfileType, number>> = {
  1: { adult: 0, child: 0 },
  2: { adult: 15, child: 10 },
  3: { adult: 20, child: 15 },
  4: { adult: 30, child: 20 },
  5: { adult: 30, child: 20 },
};

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
}

function tierMessage(tier: Tier, gapHours: number): string | null {
  if (tier === 1) {
    return `Your timezone difference is small (${formatHours(gapHours)} hrs). Your body will self-correct within 1–2 days of arrival. No pre-trip adjustment needed.`;
  }
  if (tier === 2) {
    return 'A small timezone gap. One gentle adjustment the night before takes the edge off.';
  }
  return null;
}

const LARGE_GAP_NOTE =
  'This is a large gap. 3 days of prep reduces symptoms but won’t fully close the gap — plan for 3–5 adjustment days after arrival too.';

function buildDay(day: 1 | 2 | 3, departure: Date, shiftMinutes: number, traveler: TravelerProfile): DayPlan {
  const date = addDays(departure, day - 4);
  const bedtime = traveler.bedtimeMinutes + shiftMinutes;
  const wake = traveler.wakeTimeMinutes + shiftMinutes;

  return {
    day,
    date,
    dateKey: toDateKey(date),
    shiftMinutes,
    bedtimeMinutes: bedtime,
    wakeTimeMinutes: wake,
    morningLightMinutes: wake + 30,
    eveningDimMinutes: bedtime - 90,
    screensOffMinutes: bedtime - 30,
    breakfastMinutes: traveler.breakfastMinutes + shiftMinutes,
    lunchMinutes: traveler.lunchMinutes + shiftMinutes,
    dinnerMinutes: traveler.dinnerMinutes + shiftMinutes,
    caffeineCutoffMinutes: bedtime - 6 * 60,
    exerciseMinutes: wake + 60,
  };
}

/**
 * Builds a traveler's pre-trip plan for a trip. The size of the timezone gap
 * picks a tier, which decides how many prep days there are and how far each
 * day shifts; adults shift further per day than children.
 */
export function computeJetLagPlan(traveler: TravelerProfile, trip: Trip): JetLagPlan {
  const departureDay = fromDateKey(trip.departureDate);
  const departureMoment = new Date(departureDay);
  departureMoment.setMinutes(trip.departureTimeMinutes);

  const offsetDiffHours = getOffsetDiffHours(traveler.homeTimezone, trip.destinationTimezone, departureMoment);
  const gapHours = Math.abs(offsetDiffHours);
  const tier = tierForGap(gapHours);
  const direction: Direction = offsetDiffHours > 0 ? 'eastward' : offsetDiffHours < 0 ? 'westward' : 'none';
  // Eastward travel (destination ahead) means going to bed/waking earlier each day.
  const sign = direction === 'eastward' ? -1 : 1;
  const perDay = SHIFT_MINUTES_BY_TIER[tier][traveler.profile];

  let days: DayPlan[] = [];
  if (tier === 2) {
    days = [buildDay(3, departureDay, sign * perDay, traveler)];
  } else if (tier >= 3) {
    days = ([1, 2, 3] as const).map((day) => buildDay(day, departureDay, sign * perDay * day, traveler));
  }

  return {
    direction,
    offsetDiffHours,
    tier,
    perDayShiftMinutes: perDay,
    message: tierMessage(tier, gapHours),
    note: tier === 5 ? LARGE_GAP_NOTE : null,
    days,
  };
}

/** Prep days dated today or later. */
export function remainingDays(plan: JetLagPlan, today: Date = new Date()): DayPlan[] {
  const todayKey = toDateKey(today);
  return plan.days.filter((day) => day.dateKey >= todayKey);
}
