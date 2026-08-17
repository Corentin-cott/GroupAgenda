import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface HeaderButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  side?: 'left' | 'right';
  /** Pour un bouton non collé au bord, quand l'en-tête en aligne plusieurs. */
  compact?: boolean;
  children: (color: string) => ReactNode;
}

/** Aligne l'icône sur la colonne de contenu et lui donne une zone tactile correcte. */
export function HeaderButton({
  onPress,
  accessibilityLabel,
  side = 'right',
  compact = false,
  children,
}: HeaderButtonProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        side === 'left' ? styles.left : styles.right,
        compact && styles.compact,
      ]}
    >
      {({ pressed }) => children(pressed ? theme.colors.textMuted : theme.colors.accent)}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    button: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
    right: {
      alignItems: 'flex-end',
      paddingLeft: theme.space.md,
      paddingRight: theme.space.lg,
    },
    left: {
      alignItems: 'flex-start',
      paddingLeft: theme.space.lg,
      paddingRight: theme.space.md,
    },
    compact: { paddingLeft: theme.space.sm, paddingRight: theme.space.sm },
  });
