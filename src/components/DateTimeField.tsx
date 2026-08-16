import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

/** Date et heure séparées : le picker Android n'a pas de mode combiné. */
export function DateTimeField({ label, value, onChange, error }: DateTimeFieldProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          themeVariant={theme.scheme}
          onChange={(_event, selected) => handleChange(selected)}
        />
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { gap: theme.space.xs + 2 },
    label: theme.text.label,
    row: { flexDirection: 'row', gap: theme.space.sm },
    button: {
      flex: 1,
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.space.md,
    },
    buttonError: { borderColor: theme.colors.danger },
    value: theme.text.body,
    error: { ...theme.text.label, color: theme.colors.danger },
  });
