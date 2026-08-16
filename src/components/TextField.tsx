import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor={theme.colors.placeholder}
        {...props}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { gap: theme.space.xs + 2 },
    label: theme.text.label,
    input: {
      ...theme.text.body,
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.md,
    },
    inputError: { borderColor: theme.colors.danger },
    error: { ...theme.text.label, color: theme.colors.danger },
  });
