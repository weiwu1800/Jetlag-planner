import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  text: '#11131A',
  subtext: '#5B6270',
  primary: '#2F6FED',
  accent: '#E8833D',
  border: '#E3E6EB',
  danger: '#E5484D',
};

export const darkColors = {
  background: '#0D0F14',
  card: '#1A1D24',
  text: '#F3F5F7',
  subtext: '#99A1B3',
  primary: '#6E9BFF',
  accent: '#FFA564',
  border: '#2B2F3A',
  danger: '#FF6B6E',
};

export type ThemeColors = typeof lightColors;

export function useTheme(): { colors: ThemeColors; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: scheme === 'dark' ? darkColors : lightColors, scheme };
}
