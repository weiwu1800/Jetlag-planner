import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';
import { formatShortDate, fromDateKey, toDateKey } from '@/lib/time';

interface DateFieldProps {
  label: string;
  /** "YYYY-MM-DD" */
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
}

/**
 * A form row that opens a native date picker. iOS gets a themed bottom-sheet
 * calendar with Cancel/Done; Android gets the system date dialog directly.
 */
export function DateField({ label, value, onChange, minimumDate }: DateFieldProps) {
  const { colors, scheme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Date>(() => fromDateKey(value));

  const open = () => {
    setDraft(fromDateKey(value));
    setVisible(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    setVisible(false);
    if (event.type === 'set' && selected) {
      onChange(toDateKey(selected));
    }
  };

  const confirmIOS = () => {
    onChange(toDateKey(draft));
    setVisible(false);
  };

  return (
    <View>
      <Pressable
        onPress={open}
        style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{formatShortDate(fromDateKey(value))}</Text>
      </Pressable>

      {Platform.OS === 'android' && visible && (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={handleAndroidChange}
        />
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
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                themeVariant={scheme}
                accentColor={colors.primary}
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
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24, paddingTop: 8, paddingHorizontal: 8 },
  sheetTitle: { textAlign: 'center', fontSize: 15, fontWeight: '600', marginVertical: 8 },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 8 },
  sheetButton: { padding: 8 },
});
