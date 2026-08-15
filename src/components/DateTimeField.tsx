import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/theme/colors';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

/**
 * Date et heure sont choisies séparément : c'est le seul enchaînement qui se
 * comporte pareil sur iOS et Android, le picker Android n'ayant pas de mode
 * combiné.
 */
export function DateTimeField({ label, value, onChange, error }: DateTimeFieldProps) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);

  const handleChange = (selected: Date | undefined) => {
    const current = mode;
    setMode(null);
    if (!selected) return;

    const next = new Date(value);
    if (current === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    onChange(next);
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <Pressable
          style={[styles.button, !!error && styles.buttonError]}
          onPress={() => setMode('date')}
        >
          <Text style={styles.value}>{value.toLocaleDateString()}</Text>
        </Pressable>
        <Pressable
          style={[styles.button, !!error && styles.buttonError]}
          onPress={() => setMode('time')}
        >
          <Text style={styles.value}>
            {value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Pressable>
      </View>

      {mode && (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          onChange={(_event, selected) => handleChange(selected)}
        />
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  buttonError: { borderColor: colors.danger },
  value: { fontSize: 16, color: colors.text },
  error: { color: colors.danger, fontSize: 13 },
});
