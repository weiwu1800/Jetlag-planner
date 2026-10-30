import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
}

/** A form row that opens a themed modal list to pick one option, with optional search. */
export function SelectField({ label, value, options, onChange, searchable }: SelectFieldProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) => option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q)
    );
  }, [options, query]);

  const close = () => {
    setVisible(false);
    setQuery('');
  };

  return (
    <View>
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.row, { borderColor: colors.border, backgroundColor: colors.card }]}
      >
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
          {selected?.label ?? value}
        </Text>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>

            {searchable && (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search timezones"
                placeholderTextColor={colors.subtext}
                autoCorrect={false}
                style={[
                  styles.search,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background },
                ]}
              />
            )}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                    style={styles.option}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '400',
                        fontSize: 16,
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.subtext }]}>No matching timezones</Text>
              }
            />

            <Pressable onPress={close} style={styles.closeButton}>
              <Text style={{ color: colors.subtext, fontSize: 16 }}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  value: { fontSize: 16, fontWeight: '600', maxWidth: '60%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '75%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sheetTitle: { textAlign: 'center', fontSize: 15, fontWeight: '600', marginBottom: 12 },
  search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, fontSize: 15 },
  list: { flexGrow: 0 },
  option: { paddingVertical: 14 },
  separator: { height: 1 },
  empty: { textAlign: 'center', paddingVertical: 24 },
  closeButton: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
});
