import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { computeJetLagPlan, DayPlan, Direction, remainingDays } from './jetlag';
import { loadNotificationPrefs, loadProfiles, loadTrips } from './storage';
import { normalizeMinutes } from './time';
import { NotificationCategory, TravelerProfile } from './types';

export const NOTIFICATION_CATEGORIES: { key: NotificationCategory; label: string }[] = [
  { key: 'wake', label: 'Wake' },
  { key: 'morningLight', label: 'Morning Light' },
  { key: 'meals', label: 'Meals' },
  { key: 'caffeine', label: 'Caffeine' },
  { key: 'lightsDim', label: 'Lights Dim' },
  { key: 'screensOff', label: 'Screens Off' },
  { key: 'bedtime', label: 'Bedtime' },
];

// iOS keeps at most 64 pending local notifications per app and silently drops the rest.
const MAX_SCHEDULED = 64;
const ANDROID_CHANNEL_ID = 'jetlag-plan';

interface PlannedNotification {
  category: NotificationCategory;
  date: Date;
  title: string;
  body: string;
}

const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Call once at startup so reminders also show while the app is open. */
export function configureNotificationHandler(): void {
  if (!isSupported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission if it hasn't been decided yet. Returns whether notifications are allowed. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isSupported) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Jet lag plan',
      importance: AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

function atMinutes(day: Date, minutes: number): Date {
  const result = new Date(day);
  result.setHours(0, minutes, 0, 0);
  return result;
}

function notificationsForDay(name: string, plan: DayPlan, direction: Direction): PlannedNotification[] {
  const earlier = direction === 'westward' ? 'later' : 'earlier';
  const Earlier = direction === 'westward' ? 'Later' : 'Earlier';

  const wake = normalizeMinutes(plan.wakeTimeMinutes);
  // A bedtime that's earlier on the clock than wake time (e.g. 12:30 AM) belongs to the next calendar day.
  const bedtimeRaw = normalizeMinutes(plan.bedtimeMinutes);
  const bedtime = bedtimeRaw < wake ? bedtimeRaw + 1440 : bedtimeRaw;
  const at = (minutes: number) => atMinutes(plan.date, minutes);

  return [
    {
      category: 'wake',
      date: at(wake),
      title: `${name} — Wake up Day ${plan.day}`,
      body: 'Get outside for morning light within 30 min. No sunglasses.',
    },
    {
      category: 'morningLight',
      date: at(wake + 30),
      title: `${name} ☀️ Morning light window`,
      body: `20–30 min outside in natural light helps shift your body clock ${earlier}.`,
    },
    {
      category: 'meals',
      date: at(normalizeMinutes(plan.breakfastMinutes)),
      title: `${name} 🍳 ${Earlier} breakfast today`,
      body: `Eating ${earlier} reinforces your new schedule. Keep it substantial.`,
    },
    {
      category: 'caffeine',
      date: at(bedtime - 6 * 60),
      title: `${name} ☕ Last coffee of the day`,
      body: 'Caffeine after this will push your body clock the wrong way tonight.',
    },
    {
      category: 'lightsDim',
      date: at(bedtime - 90),
      title: `${name} 🌙 Start dimming lights`,
      body: 'Switch to lamps and dim your screen. Bright light now delays your adjustment.',
    },
    {
      category: 'meals',
      date: at(normalizeMinutes(plan.dinnerMinutes)),
      title: `${name} 🍽️ ${Earlier} dinner tonight`,
      body: 'Keep it light. Complex carbs 2–3 hrs before bed support your adjustment.',
    },
    {
      category: 'screensOff',
      date: at(bedtime - 30),
      title: `${name} 📵 Screens off soon`,
      body: 'Put devices away. Blue light at this hour shifts your clock the wrong way.',
    },
    {
      category: 'bedtime',
      date: at(bedtime),
      title: `${name} 🛏️ Bedtime Day ${plan.day}`,
      body: `${Earlier} than usual tonight. Keep your room dark and cool.`,
    },
  ];
}

/**
 * Cancels every scheduled reminder and rebuilds them from the saved trips,
 * profiles and category toggles. Safe to call after any change to those.
 */
export async function rescheduleAllNotifications(): Promise<void> {
  if (!isSupported) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) return;

  const [profiles, trips, prefs] = await Promise.all([loadProfiles(), loadTrips(), loadNotificationPrefs()]);
  const profilesById = new Map<string, TravelerProfile>(profiles.map((p) => [p.id, p]));
  const now = new Date();

  const planned: PlannedNotification[] = [];
  for (const trip of trips) {
    for (const travelerId of trip.travelerIds) {
      const traveler = profilesById.get(travelerId);
      if (!traveler) continue;
      // Tier 1 plans have no days; tier 2 plans only contain Day 3.
      const plan = computeJetLagPlan(traveler, trip);
      for (const day of remainingDays(plan, now)) {
        planned.push(...notificationsForDay(traveler.name, day, plan.direction));
      }
    }
  }

  const upcoming = planned
    .filter((n) => prefs[n.category] && n.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_SCHEDULED);

  for (const notification of upcoming) {
    await Notifications.scheduleNotificationAsync({
      content: { title: notification.title, body: notification.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notification.date,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}

/** Whether the OS currently allows this app to post notifications. */
export async function notificationsAllowed(): Promise<boolean> {
  if (!isSupported) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}
