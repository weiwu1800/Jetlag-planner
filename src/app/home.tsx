import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayCard } from '@/components/DayCard';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SelectField } from '@/components/SelectField';
import { computeJetLagPlan, JetLagPlan, remainingDays } from '@/lib/jetlag';
import { NOTIFICATION_CATEGORIES, notificationsAllowed, rescheduleAllNotifications } from '@/lib/notifications';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadActiveTripId,
  loadNotificationPrefs,
  loadProfiles,
  loadTrips,
  saveActiveTripId,
  saveNotificationPrefs,
} from '@/lib/storage';
import { ThemeColors, useTheme } from '@/lib/theme';
import { formatMinutes, formatShortDate, fromDateKey } from '@/lib/time';
import { TIMEZONE_OPTIONS } from '@/lib/timezones';
import { NotificationCategory, NotificationPrefs, TravelerProfile, Trip } from '@/lib/types';

function planSummary(plan: JetLagPlan): string {
  const hours = Math.abs(plan.offsetDiffHours);
  if (plan.direction === 'none') return 'Same timezone — no shift needed';
  const heading = `Traveling ${plan.direction === 'eastward' ? 'east' : 'west'} · ${hours} hr${hours === 1 ? '' : 's'}`;
  const way = plan.direction === 'eastward' ? 'earlier' : 'later';
  if (plan.tier === 1) return heading;
  if (plan.tier === 2) return `${heading} · one ${plan.perDayShiftMinutes}-min shift ${way}`;
  return `${heading} · ${plan.perDayShiftMinutes} min ${way} each day`;
}

function InfoCard({ colors, children }: { colors: ThemeColors; children: string }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.infoText, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

export default function Home() {
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState<TravelerProfile[] | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [travelerId, setTravelerId] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [allowed, setAllowed] = useState(true);

  // Re-read everything each time this screen gains focus, so edits made on
  // the trip or traveler screens are reflected immediately when navigating back.
  useFocusEffect(
    useCallback(() => {
      Promise.all([loadProfiles(), loadTrips(), loadActiveTripId(), loadNotificationPrefs(), notificationsAllowed()]).then(
        ([storedProfiles, storedTrips, storedActiveId, storedPrefs, isAllowed]) => {
          setProfiles(storedProfiles);
          setTrips([...storedTrips].sort((a, b) => a.departureDate.localeCompare(b.departureDate)));
          setActiveTripId(storedActiveId);
          setPrefs(storedPrefs);
          setAllowed(isAllowed);
        }
      );
    }, [])
  );

  if (!profiles) {
    return <View style={[styles.safe, { backgroundColor: colors.background }]} />;
  }

  const activeTrip = trips.find((t) => t.id === activeTripId) ?? trips[0];
  const travelers = activeTrip
    ? activeTrip.travelerIds
        .map((tid) => profiles.find((p) => p.id === tid))
        .filter((p): p is TravelerProfile => p !== undefined)
    : [];
  const traveler = travelers.find((t) => t.id === travelerId) ?? travelers[0];
  const plan = activeTrip && traveler ? computeJetLagPlan(traveler, activeTrip) : null;
  const days = plan ? remainingDays(plan) : [];

  const switchTrip = (id: string) => {
    setActiveTripId(id);
    saveActiveTripId(id);
  };

  const togglePref = async (key: NotificationCategory, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await saveNotificationPrefs(next);
    await rescheduleAllNotifications();
  };

  const destinationLabel = activeTrip
    ? (TIMEZONE_OPTIONS.find((o) => o.value === activeTrip.destinationTimezone)?.label ?? activeTrip.destinationTimezone)
    : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: colors.subtext }]}>ACTIVE TRIP</Text>
            <Text style={[styles.name, { color: colors.text }]}>{activeTrip?.name ?? 'No trip yet'}</Text>
            {activeTrip && (
              <Text style={[styles.profile, { color: colors.subtext }]}>
                Departs {formatShortDate(fromDateKey(activeTrip.departureDate))} ·{' '}
                {formatMinutes(activeTrip.departureTimeMinutes)} · {destinationLabel}
              </Text>
            )}
          </View>
          {activeTrip && (
            <Pressable
              onPress={() => router.push({ pathname: '/trip', params: { id: activeTrip.id } })}
              style={[styles.editButton, { borderColor: colors.border }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.linkRow}>
          <Pressable onPress={() => router.push('/trip')}>
            <Text style={[styles.link, { color: colors.primary }]}>+ New trip</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/profiles')}>
            <Text style={[styles.link, { color: colors.primary }]}>Travelers</Text>
          </Pressable>
        </View>

        {trips.length > 1 && activeTrip && (
          <SelectField
            label="Switch trip"
            value={activeTrip.id}
            options={trips.map((t) => ({ label: t.name, value: t.id }))}
            onChange={switchTrip}
          />
        )}

        {!activeTrip && (
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Create a trip to get a day-by-day plan for each traveler.
            </Text>
            <Pressable
              onPress={() => router.push('/trip')}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.primaryButtonText}>Create a Trip</Text>
            </Pressable>
          </View>
        )}

        {activeTrip && !traveler && (
          <InfoCard colors={colors}>No travelers on this trip yet. Tap Edit to add one.</InfoCard>
        )}

        {travelers.length > 1 && traveler && (
          <SegmentedControl<string>
            value={traveler.id}
            onChange={setTravelerId}
            options={travelers.map((t) => ({ label: t.name, value: t.id }))}
          />
        )}

        {plan && traveler && (
          <>
            <Text style={[styles.travelerLine, { color: colors.subtext }]}>
              {traveler.name} · {traveler.profile === 'adult' ? 'Adult' : 'Child'} · {planSummary(plan)}
            </Text>

            {plan.message && <InfoCard colors={colors}>{plan.message}</InfoCard>}
            {plan.note && <InfoCard colors={colors}>{plan.note}</InfoCard>}

            {plan.tier > 1 && days.length === 0 && (
              <InfoCard colors={colors}>
                You&apos;re on your way! Focus on morning light and local meal times at your destination.
              </InfoCard>
            )}

            <View style={styles.cards}>
              {days.map((day) => (
                <DayCard key={day.day} plan={day} direction={plan.direction} />
              ))}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>REMINDERS</Text>
        <View style={[styles.toggleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {!allowed && (
            <Text style={[styles.toggleHint, { color: colors.danger }]}>
              Notifications are turned off for this app in system settings.
            </Text>
          )}
          {NOTIFICATION_CATEGORIES.map((category, index) => (
            <View
              key={category.key}
              style={[
                styles.toggleRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{category.label}</Text>
              <Switch
                value={prefs[category.key]}
                onValueChange={(value) => togglePref(category.key, value)}
                trackColor={{ true: colors.primary, false: colors.border }}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerText: { flex: 1, marginRight: 12 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 },
  name: { fontSize: 24, fontWeight: '700' },
  profile: { fontSize: 13, marginTop: 4 },
  editButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  linkRow: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  link: { fontSize: 15, fontWeight: '600' },
  travelerLine: { fontSize: 13, marginBottom: 12 },
  infoCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  infoText: { fontSize: 14, lineHeight: 20 },
  primaryButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cards: { marginTop: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  toggleCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4 },
  toggleHint: { fontSize: 13, paddingTop: 10 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  toggleLabel: { fontSize: 15 },
});
