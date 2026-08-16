import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Surface de liste : bord doux et fond distinct, plutôt qu'un filet de séparation. */
export function Card({ children, onPress, style }: CardProps) {
  const styles = useThemedStyles(createStyles);

  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space.md + 2,
      paddingVertical: theme.space.md,
      gap: 3,
    },
    pressed: { backgroundColor: theme.colors.surfaceAlt },
  });
