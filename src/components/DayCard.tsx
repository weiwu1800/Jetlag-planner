import { StyleSheet, Text, View } from 'react-native';

import { DayPlan, Direction } from '@/lib/jetlag';
import { useTheme } from '@/lib/theme';
import { formatMinutes, formatShortDate } from '@/lib/time';

interface LeverRow {
  label: string;
  minutes: number;
  tip?: string;
}

interface Lever {
  icon: string;
  title: string;
  rows: LeverRow[];
  tip?: string;
}

function shiftLabel(shiftMinutes: number, direction: Direction): string {
  if (shiftMinutes === 0) return 'Normal schedule';
  return `${Math.abs(shiftMinutes)} min ${direction === 'westward' ? 'later' : 'earlier'} than usual`;
}

export function DayCard({ plan, direction }: { plan: DayPlan; direction: Direction }) {
  const { colors } = useTheme();

  const levers: Lever[] = [
    {
      icon: '☀️',
      title: 'LIGHT',
      rows: [
        {
          label: 'Morning light',
          minutes: plan.morningLightMinutes,
          tip: 'Get outside within 30 min of waking. 20–30 min of natural light, no sunglasses.',
        },
        {
          label: 'Evening dim',
          minutes: plan.eveningDimMinutes,
          tip: 'Switch to lamps, dim screens, avoid overhead lights.',
        },
      ],
    },
    {
      icon: '🍽️',
      title: 'MEALS',
      rows: [
        { label: 'Breakfast', minutes: plan.breakfastMinutes },
        { label: 'Lunch', minutes: plan.lunchMinutes },
        { label: 'Dinner', minutes: plan.dinnerMinutes },
      ],
      tip: 'Keep dinner light. Complex carbs 2–3 hrs before bed help with adjustment.',
    },
    {
      icon: '☕',
      title: 'CAFFEINE',
      rows: [{ label: 'Cutoff', minutes: plan.caffeineCutoffMinutes }],
      tip: 'Last coffee of the day. Having caffeine after this pushes your body clock the wrong way.',
    },
    {
      icon: '🏃',
      title: 'EXERCISE',
      rows: [{ label: 'Morning exercise', minutes: plan.exerciseMinutes }],
      tip: 'Light exercise in the morning (walk, jog) advances your clock. Even 20 min helps.',
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.day, { color: colors.text }]}>
          Day {plan.day} · {formatShortDate(plan.date)}
        </Text>
        <Text style={[styles.shift, { color: colors.subtext }]}>{shiftLabel(plan.shiftMinutes, direction)}</Text>
      </View>

      <View style={styles.timesRow}>
        <View style={styles.timeBlock}>
          <Text style={[styles.timeLabel, { color: colors.subtext }]}>BEDTIME</Text>
          <Text style={[styles.timeValue, { color: colors.primary }]}>{formatMinutes(plan.bedtimeMinutes)}</Text>
        </View>
        <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
        <View style={styles.timeBlock}>
          <Text style={[styles.timeLabel, { color: colors.subtext }]}>WAKE UP</Text>
          <Text style={[styles.timeValue, { color: colors.accent }]}>{formatMinutes(plan.wakeTimeMinutes)}</Text>
        </View>
      </View>

      {levers.map((lever) => (
        <View key={lever.title} style={[styles.lever, { borderTopColor: colors.border }]}>
          <Text style={[styles.leverTitle, { color: colors.subtext }]}>
            {lever.icon}  {lever.title}
          </Text>
          {lever.rows.map((row) => (
            <View key={row.label}>
              <View style={styles.leverRow}>
                <Text style={[styles.leverLabel, { color: colors.text }]}>{row.label}</Text>
                <Text style={[styles.leverValue, { color: colors.text }]}>{formatMinutes(row.minutes)}</Text>
              </View>
              {row.tip && <Text style={[styles.tip, { color: colors.subtext }]}>{row.tip}</Text>}
            </View>
          ))}
          {lever.tip && <Text style={[styles.tip, { color: colors.subtext }]}>{lever.tip}</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  headerRow: { marginBottom: 12 },
  day: { fontSize: 15, fontWeight: '700' },
  shift: { fontSize: 12, marginTop: 2 },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
  },
  timeBlock: { flex: 1, alignItems: 'center' },
  timeDivider: { width: 1, height: 36 },
  timeLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  timeValue: { fontSize: 20, fontWeight: '700' },
  lever: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 4, paddingBottom: 4 },
  leverTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  leverRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  leverLabel: { fontSize: 14 },
  leverValue: { fontSize: 14, fontWeight: '600' },
  tip: { fontSize: 13, lineHeight: 18, marginTop: 2, marginBottom: 6 },
});
