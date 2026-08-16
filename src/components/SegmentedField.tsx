import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface SegmentedFieldProps<T extends string> {
  label?: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (value: T) => void;
  /** Empile les segments : utile quand les libellés sont longs. */
  vertical?: boolean;
}

export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
  vertical = false,
}: SegmentedFieldProps<T>) {
  const styles = useThemedStyles(createStyles);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.row, vertical && styles.column]}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              style={[styles.segment, isSelected && styles.segmentSelected]}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.segmentLabel, isSelected && styles.segmentLabelSelected]}>
                {option.label}
              </Text>
              {vertical && !!option.hint && <Text style={styles.segmentHint}>{option.hint}</Text>}
            </Pressable>
          );
        })}
      </View>

      {!vertical && !!selected?.hint && <Text style={styles.hint}>{selected.hint}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { gap: theme.space.xs + 2 },
    label: theme.text.label,
    row: { flexDirection: 'row', gap: theme.space.sm },
    column: { flexDirection: 'column' },
    segment: {
      flex: 1,
      minHeight: 46,
      justifyContent: 'center',
      gap: 2,
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.sm,
    },
    segmentSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accentSoft },
    segmentLabel: { ...theme.text.body, color: theme.colors.textMuted },
    segmentLabelSelected: { color: theme.colors.accent, fontWeight: '600' },
    segmentHint: theme.text.meta,
    hint: theme.text.meta,
  });
