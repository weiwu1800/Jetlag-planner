import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { loadProfiles } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

/**
 * Entry route: silently checks whether setup has already been completed and
 * routes straight to Home, or to Setup for first-time users.
 */
export default function Index() {
  const { colors } = useTheme();

  useEffect(() => {
    let isMounted = true;

    loadProfiles().then((profiles) => {
      if (!isMounted) return;
      router.replace(profiles.length > 0 ? '/home' : '/setup');
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
