import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError, style]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
});
