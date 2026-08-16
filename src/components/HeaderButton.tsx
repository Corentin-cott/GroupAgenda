import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface HeaderButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  children: (color: string) => ReactNode;
}

/** Aligne l'icône sur la colonne de contenu et lui donne une zone tactile correcte. */
export function HeaderButton({ onPress, accessibilityLabel, children }: HeaderButtonProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={styles.button}
    >
      {({ pressed }) => children(pressed ? theme.colors.textMuted : theme.colors.accent)}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingLeft: theme.space.md,
      paddingRight: theme.space.lg,
    },
  });
