import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentedControl } from '@/components/SegmentedControl';
import { SelectField } from '@/components/SelectField';
import { TimeField } from '@/components/TimeField';
import { rescheduleAllNotifications } from '@/lib/notifications';
import { createId, DEFAULT_MEAL_TIMES, loadProfiles, loadTrips, saveProfiles, saveTrips } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { TIMEZONE_OPTIONS } from '@/lib/timezones';
import { ProfileType, TravelerProfile } from '@/lib/types';

function defaultProfile(): TravelerProfile {
  return {
    id: createId(),
    name: '',
    profile: 'adult',
    bedtimeMinutes: 23 * 60, // 11:00 PM
    wakeTimeMinutes: 7 * 60, // 7:00 AM
    ...DEFAULT_MEAL_TIMES,
    homeTimezone: 'America/Los_Angeles',
    destinationTimezone: 'Europe/London',
  };
}

/** Creates a traveler profile, or edits the one passed as `?id=`. */
export default function Setup() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [profile, setProfile] = useState<TravelerProfile>(defaultProfile);
  const [existing, setExisting] = useState<TravelerProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadProfiles().then((stored) => {
      setExisting(stored);
      const match = stored.find((p) => p.id === id);
      if (match) {
        setProfile(match);
      } else if (stored.length > 0) {
        // New traveler: start from the first traveler's timezones, which are usually shared.
        setProfile((prev) => ({
          ...prev,
          homeTimezone: stored[0].homeTimezone,
          destinationTimezone: stored[0].destinationTimezone,
        }));
      }
      setLoaded(true);
    });
  }, [id]);

  const update = <K extends keyof TravelerProfile>(key: K, value: TravelerProfile[K]) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const isEditing = existing.some((p) => p.id === profile.id);
  const isFirstRun = existing.length === 0;
  const canSave = profile.name.trim().length > 0;

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const handleSave = async () => {
    if (!canSave) return;
    const saved = { ...profile, name: profile.name.trim() };
    const next = isEditing ? existing.map((p) => (p.id === saved.id ? saved : p)) : [...existing, saved];
    await saveProfiles(next);
    await rescheduleAllNotifications();
    leave();
  };

  const handleDelete = async () => {
    await saveProfiles(existing.filter((p) => p.id !== profile.id));
    const trips = await loadTrips();
    await saveTrips(trips.map((t) => ({ ...t, travelerIds: t.travelerIds.filter((tid) => tid !== profile.id) })));
    await rescheduleAllNotifications();
    leave();
  };

  if (!loaded) {
    return <View style={[styles.safe, { backgroundColor: colors.background }]} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!isFirstRun && (
            <Pressable onPress={leave} style={styles.backButton}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>‹ Back</Text>
            </Pressable>
          )}
          <Text style={[styles.title, { color: colors.text }]}>
            {isFirstRun ? 'Jet Lag Setup' : isEditing ? 'Edit Traveler' : 'Add Traveler'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Tell us about this traveler&apos;s normal routine, and we&apos;ll build their pre-trip adjustment plan.
          </Text>

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>NAME</Text>
          <TextInput
            value={profile.name}
            onChangeText={(text) => update('name', text)}
            placeholder="e.g. WW or Kids"
            placeholderTextColor={colors.subtext}
            returnKeyType="done"
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          />

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>PROFILE</Text>
          <SegmentedControl<ProfileType>
            label="Who is this plan for?"
            value={profile.profile}
            onChange={(v) => update('profile', v)}
            options={[
              { label: 'Adult', value: 'adult' },
              { label: 'Child', value: 'child' },
            ]}
          />

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>NORMAL SLEEP SCHEDULE</Text>
          <TimeField label="Bedtime" minutes={profile.bedtimeMinutes} onChange={(m) => update('bedtimeMinutes', m)} />
          <TimeField
            label="Wake time"
            minutes={profile.wakeTimeMinutes}
            onChange={(m) => update('wakeTimeMinutes', m)}
          />

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>NORMAL MEAL TIMES</Text>
          <TimeField
            label="Breakfast"
            minutes={profile.breakfastMinutes}
            onChange={(m) => update('breakfastMinutes', m)}
          />
          <TimeField label="Lunch" minutes={profile.lunchMinutes} onChange={(m) => update('lunchMinutes', m)} />
          <TimeField label="Dinner" minutes={profile.dinnerMinutes} onChange={(m) => update('dinnerMinutes', m)} />

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>TIMEZONES</Text>
          <SelectField
            label="Home timezone"
            value={profile.homeTimezone}
            options={TIMEZONE_OPTIONS}
            onChange={(v) => update('homeTimezone', v)}
            searchable
          />
          <SelectField
            label="Usual destination"
            value={profile.destinationTimezone}
            options={TIMEZONE_OPTIONS}
            onChange={(v) => update('destinationTimezone', v)}
            searchable
          />
          <Text style={[styles.hint, { color: colors.subtext }]}>
            New trips start with this destination; you can override it per trip.
          </Text>

          <Pressable
            disabled={!canSave}
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: canSave ? colors.primary : colors.border }]}
          >
            <Text style={styles.saveButtonText}>{isFirstRun ? 'Save & Continue' : 'Save Traveler'}</Text>
          </Pressable>

          {isEditing && (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600' }}>Delete Traveler</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16 },
  hint: { fontSize: 12, marginLeft: 4, marginTop: -4 },
  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  deleteButton: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
});
