import AsyncStorage from '@react-native-async-storage/async-storage';

import { NotificationPrefs, ProfileType, TravelerProfile, Trip } from './types';

const LEGACY_SETTINGS_KEY = 'jetlaghelper:settings:v1';
const PROFILES_KEY = 'jetlaghelper:profiles:v1';
const TRIPS_KEY = 'jetlaghelper:trips:v1';
const ACTIVE_TRIP_KEY = 'jetlaghelper:activeTripId:v1';
const NOTIFICATION_PREFS_KEY = 'jetlaghelper:notificationPrefs:v1';

export const DEFAULT_MEAL_TIMES = {
  breakfastMinutes: 7 * 60 + 30, // 7:30 AM
  lunchMinutes: 12 * 60 + 30, // 12:30 PM
  dinnerMinutes: 18 * 60 + 30, // 6:30 PM
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  wake: true,
  morningLight: true,
  meals: true,
  caffeine: true,
  lightsDim: true,
  screensOff: true,
  bedtime: true,
};

/** Shape stored by the original single-profile version of the app. */
interface LegacySettings {
  name: string;
  bedtimeMinutes: number;
  wakeTimeMinutes: number;
  homeTimezone: string;
  destinationTimezone: string;
  profile: ProfileType;
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Loads saved traveler profiles. On first run after upgrading, converts the
 * old single-settings record into a profile so existing users keep their data.
 */
export async function loadProfiles(): Promise<TravelerProfile[]> {
  const profiles = await readJson<TravelerProfile[]>(PROFILES_KEY);
  if (profiles) return profiles.map((p) => ({ ...DEFAULT_MEAL_TIMES, ...p }));

  const legacy = await readJson<LegacySettings>(LEGACY_SETTINGS_KEY);
  if (!legacy) return [];

  const migrated: TravelerProfile[] = [{ ...DEFAULT_MEAL_TIMES, ...legacy, id: createId() }];
  await saveProfiles(migrated);
  await AsyncStorage.removeItem(LEGACY_SETTINGS_KEY);
  return migrated;
}

export async function saveProfiles(profiles: TravelerProfile[]): Promise<void> {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function loadTrips(): Promise<Trip[]> {
  return (await readJson<Trip[]>(TRIPS_KEY)) ?? [];
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}

export async function loadActiveTripId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_TRIP_KEY);
}

export async function saveActiveTripId(id: string | null): Promise<void> {
  if (id) await AsyncStorage.setItem(ACTIVE_TRIP_KEY, id);
  else await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
}

export async function loadNotificationPrefs(): Promise<NotificationPrefs> {
  const stored = await readJson<Partial<NotificationPrefs>>(NOTIFICATION_PREFS_KEY);
  return { ...DEFAULT_NOTIFICATION_PREFS, ...stored };
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}
