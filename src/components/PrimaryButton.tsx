import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  pending?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, pending, disabled, style }: PrimaryButtonProps) {
  const inactive = pending || disabled;

  return (
    <Pressable
      style={[styles.button, inactive && styles.inactive, style]}
      disabled={inactive}
      onPress={onPress}
      accessibilityRole="button"
    >
      {pending ? (
        <ActivityIndicator color={colors.onAccent} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.accent,
  },
  inactive: { opacity: 0.6 },
  label: { color: colors.onAccent, fontSize: 16, fontWeight: '600' },
});
