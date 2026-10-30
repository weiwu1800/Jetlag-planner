export type ProfileType = 'adult' | 'child';

/** A saved traveler, e.g. "WW" (adult) or "Kids" (child). */
export interface TravelerProfile {
  id: string;
  name: string;
  profile: ProfileType;
  /** Minutes since midnight, in home-timezone local time. */
  bedtimeMinutes: number;
  /** Minutes since midnight, in home-timezone local time. */
  wakeTimeMinutes: number;
  /** Minutes since midnight, in home-timezone local time. */
  breakfastMinutes: number;
  /** Minutes since midnight, in home-timezone local time. */
  lunchMinutes: number;
  /** Minutes since midnight, in home-timezone local time. */
  dinnerMinutes: number;
  /** IANA timezone identifier, e.g. "America/Los_Angeles". */
  homeTimezone: string;
  /** IANA timezone identifier, e.g. "Europe/London". Default for new trips. */
  destinationTimezone: string;
}

export interface Trip {
  id: string;
  name: string;
  /** Local calendar date of departure, as "YYYY-MM-DD". */
  departureDate: string;
  /** Minutes since midnight, local departure time. */
  departureTimeMinutes: number;
  /** IANA timezone identifier; overrides each traveler's profile default. */
  destinationTimezone: string;
  travelerIds: string[];
}

export type NotificationCategory =
  | 'wake'
  | 'morningLight'
  | 'meals'
  | 'caffeine'
  | 'lightsDim'
  | 'screensOff'
  | 'bedtime';

export type NotificationPrefs = Record<NotificationCategory, boolean>;
