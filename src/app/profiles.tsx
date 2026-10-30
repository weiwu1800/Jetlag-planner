import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadProfiles } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import { formatMinutes } from '@/lib/time';
import { TravelerProfile } from '@/lib/types';

/** Lists saved traveler profiles, with links to edit each or add a new one. */
export default function Profiles() {
  const { colors } = useTheme();
  const [profiles, setProfiles] = useState<TravelerProfile[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadProfiles().then(setProfiles);
    }, [])
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>‹ Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Travelers</Text>

        {profiles.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => router.push({ pathname: '/setup', params: { id: p.id } })}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]}>{p.name}</Text>
              <Text style={[styles.detail, { color: colors.subtext }]}>
                {p.profile === 'adult' ? 'Adult' : 'Child'} · Sleeps {formatMinutes(p.bedtimeMinutes)} –{' '}
                {formatMinutes(p.wakeTimeMinutes)}
              </Text>
            </View>
            <Text style={{ color: colors.subtext, fontSize: 20 }}>›</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={() => router.push('/setup')}
          style={[styles.addButton, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Add Traveler</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '700' },
  detail: { fontSize: 13, marginTop: 4 },
  addButton: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 6 },
});
