import { StyleSheet, Text, View } from 'react-native';
import { fromLocalInputValue, toLocalInputValue } from '@/lib/date';
import { colors } from '@/theme/colors';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

/** Le navigateur fournit un sélecteur natif ; Metro charge la variante mobile sur iOS/Android. */
export function DateTimeField({ label, value, onChange, error }: DateTimeFieldProps) {
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
          padding: 12,
          fontSize: 16,
          fontFamily: 'inherit',
          color: colors.text,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 8,
        }}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, color: colors.muted },
  error: { color: colors.danger, fontSize: 13 },
});
