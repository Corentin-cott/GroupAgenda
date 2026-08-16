import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  pending?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  pending,
  disabled,
  variant = 'solid',
  style,
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const inactive = pending || disabled;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'outline' && styles.outline,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
      disabled={inactive}
      onPress={onPress}
      accessibilityRole="button"
    >
      {pending ? (
        <ActivityIndicator
          color={variant === 'solid' ? theme.colors.onAccent : theme.colors.accent}
        />
      ) : (
        <Text style={[styles.label, variant === 'outline' && styles.outlineLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      minHeight: 50,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space.lg,
      backgroundColor: theme.colors.accent,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
    },
    pressed: { opacity: 0.85 },
    inactive: { opacity: 0.5 },
    label: { ...theme.text.button, color: theme.colors.onAccent },
    outlineLabel: { color: theme.colors.text },
  });
