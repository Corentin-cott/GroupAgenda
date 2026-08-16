import { StyleSheet, Text, View } from 'react-native';
import { fromLocalInputValue, toLocalInputValue } from '@/lib/date';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

/** Le navigateur fournit un sélecteur natif ; Metro charge la variante mobile sur iOS/Android. */
export function DateTimeField({ label, value, onChange, error }: DateTimeFieldProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="datetime-local"
        value={toLocalInputValue(value)}
        onChange={(event) => {
          const next = fromLocalInputValue(event.target.value);
          if (next) onChange(next);
        }}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: theme.space.md,
          fontSize: theme.text.body.fontSize,
          fontFamily: theme.text.body.fontFamily,
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
          colorScheme: theme.scheme,
          borderWidth: Math.max(theme.borderWidth, 1),
          borderStyle: 'solid',
          borderColor: error ? theme.colors.danger : theme.colors.border,
          borderRadius: theme.radius.md,
        }}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { gap: theme.space.xs + 2 },
    label: theme.text.label,
    error: { ...theme.text.label, color: theme.colors.danger },
  });
