import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import { dateToMinutes, formatMinutes, minutesToDate } from '@/lib/time';

interface TimeFieldProps {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
}

/**
 * A form row that opens a native time picker. iOS gets a themed bottom-sheet
 * spinner with Cancel/Done; Android gets the system time dialog directly.
 */
export function TimeField({ label, minutes, onChange }: TimeFieldProps) {
  const { colors, scheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Date>(() => minutesToDate(minutes));

  const open = () => {
    setDraft(minutesToDate(minutes));
    setVisible(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setVisible(false);
    if (event.type === 'set' && selected) {
      onChange(dateToMinutes(selected));
    }
  };

  const confirmIOS = () => {
    onChange(dateToMinutes(draft));
    setVisible(false);
  };

  return (
    <View>
      <Pressable
        onPress={open}
        style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatMinutes(minutes)}</Text>
      </Pressable>

      {Platform.OS === 'android' && visible && (
        <DateTimePicker value={draft} mode="time" display="default" onChange={handleAndroidChange} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
            <Pressable
              style={[styles.sheet, { backgroundColor: colors.card }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>
              <DateTimePicker
                value={draft}
                mode="time"
                display="spinner"
                themeVariant={scheme}
                textColor={colors.text}
                onChange={(_, selected) => selected && setDraft(selected)}
              />
              <View style={styles.sheetActions}>
                <Pressable onPress={() => setVisible(false)} style={styles.sheetButton}>
                  <Text style={{ color: colors.subtext, fontSize: 16 }}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmIOS} style={styles.sheetButton}>
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Done</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  label: { fontSize: 15 },
  value: { fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24, paddingTop: 8 },
  sheetTitle: { textAlign: 'center', fontSize: 15, fontWeight: '600', marginVertical: 8 },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 8 },
  sheetButton: { padding: 8 },
});
