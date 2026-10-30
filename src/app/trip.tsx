import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

import { DateField } from '@/components/DateField';
import { SelectField } from '@/components/SelectField';
import { TimeField } from '@/components/TimeField';
import { rescheduleAllNotifications } from '@/lib/notifications';
import { createId, loadProfiles, loadTrips, saveActiveTripId, saveTrips } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { addDays, toDateKey } from '@/lib/time';
import { TIMEZONE_OPTIONS } from '@/lib/timezones';
import { TravelerProfile, Trip } from '@/lib/types';

/** Creates a trip, or edits the one passed as `?id=`. */
export default function TripEditor() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [profiles, setProfiles] = useState<TravelerProfile[]>([]);

  useEffect(() => {
    Promise.all([loadTrips(), loadProfiles()]).then(([storedTrips, storedProfiles]) => {
      setTrips(storedTrips);
      setProfiles(storedProfiles);
      setTrip(
        storedTrips.find((t) => t.id === id) ?? {
          id: createId(),
          name: '',
          // Default far enough out for a full 3-day plan.
          departureDate: toDateKey(addDays(new Date(), 7)),
          departureTimeMinutes: 10 * 60,
          destinationTimezone: storedProfiles[0]?.destinationTimezone ?? 'Europe/London',
          travelerIds: storedProfiles.map((p) => p.id),
        }
      );
    });
  }, [id]);

  // Pick up travelers added via the "+ New traveler" shortcut.
  useFocusEffect(
    useCallback(() => {
      loadProfiles().then(setProfiles);
    }, [])
  );

  if (!trip) {
    return <View style={[styles.safe, { backgroundColor: colors.background }]} />;
  }

  const update = <K extends keyof Trip>(key: K, value: Trip[K]) =>
    setTrip((prev) => (prev ? { ...prev, [key]: value } : prev));

  const toggleTraveler = (travelerId: string) =>
    update(
      'travelerIds',
      trip.travelerIds.includes(travelerId)
        ? trip.travelerIds.filter((tid) => tid !== travelerId)
        : [...trip.travelerIds, travelerId]
    );

  const isEditing = trips.some((t) => t.id === trip.id);
  const canSave = trip.name.trim().length > 0 && trip.travelerIds.length > 0;

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  };

  const handleSave = async () => {
    if (!canSave) return;
    const saved = { ...trip, name: trip.name.trim() };
    await saveTrips(isEditing ? trips.map((t) => (t.id === saved.id ? saved : t)) : [...trips, saved]);
    await saveActiveTripId(saved.id);
    await rescheduleAllNotifications();
    leave();
  };

  const handleDelete = async () => {
    await saveTrips(trips.filter((t) => t.id !== trip.id));
    await saveActiveTripId(null);
    await rescheduleAllNotifications();
    leave();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={leave} style={styles.backButton}>
            <Text style={{ color: colors.primary, fontSize: 16 }}>‹ Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{isEditing ? 'Edit Trip' : 'New Trip'}</Text>

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>TRIP NAME</Text>
          <TextInput
            value={trip.name}
            onChangeText={(text) => update('name', text)}
            placeholder="e.g. London Dec Trip"
            placeholderTextColor={colors.subtext}
            returnKeyType="done"
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
          />

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>DEPARTURE</Text>
          <DateField
            label="Date"
            value={trip.departureDate}
            onChange={(v) => update('departureDate', v)}
            minimumDate={new Date()}
          />
          <TimeField
            label="Flight time"
            minutes={trip.departureTimeMinutes}
            onChange={(m) => update('departureTimeMinutes', m)}
          />

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>DESTINATION</Text>
          <SelectField
            label="Destination timezone"
            value={trip.destinationTimezone}
            options={TIMEZONE_OPTIONS}
            onChange={(v) => update('destinationTimezone', v)}
            searchable
          />

          <Text style={[styles.sectionLabel, { color: colors.subtext }]}>TRAVELERS</Text>
          <View style={styles.chips}>
            {profiles.map((p) => {
              const selected = trip.travelerIds.includes(p.id);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => toggleTraveler(p.id)}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary : colors.card,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.text }]}>
                    {selected ? '✓ ' : ''}
                    {p.name} · {p.profile === 'adult' ? 'Adult' : 'Child'}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => router.push('/setup')}
              style={[styles.chip, { borderColor: colors.border, borderStyle: 'dashed' }]}
            >
              <Text style={[styles.chipText, { color: colors.primary }]}>+ New traveler</Text>
            </Pressable>
          </View>
          {trip.travelerIds.length === 0 && (
            <Text style={[styles.hint, { color: colors.subtext }]}>Pick at least one traveler.</Text>
          )}

          <Pressable
            disabled={!canSave}
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: canSave ? colors.primary : colors.border }]}
          >
            <Text style={styles.saveButtonText}>Save Trip</Text>
          </Pressable>

          {isEditing && (
            <Pressable onPress={handleDelete} style={styles.deleteButton}>
              <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '600' }}>Delete Trip</Text>
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
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 12, marginLeft: 4, marginTop: 8 },
  saveButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  deleteButton: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
});
