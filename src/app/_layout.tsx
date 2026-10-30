import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import {
  configureNotificationHandler,
  ensureNotificationPermission,
  rescheduleAllNotifications,
} from '@/lib/notifications';

configureNotificationHandler();

export default function RootLayout() {
  const scheme = useColorScheme();

  // Ask for notification permission on first launch, then refresh reminders so
  // days that have passed since the last launch drop off the schedule.
  useEffect(() => {
    ensureNotificationPermission()
      .then(rescheduleAllNotifications)
      .catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
