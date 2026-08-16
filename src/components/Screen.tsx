import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Formulaire court : centré verticalement, et défilable si la fenêtre est trop basse. */
  centered?: boolean;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/** Colonne centrée et bornée. Au flex, pas au breakpoint JS : celui-ci ne suit pas le redimensionnement web. */
export function Screen({ children, centered = false, maxWidth = 720, style }: ScreenProps) {
  const { theme } = useTheme();

  const column: StyleProp<ViewStyle> = [
    styles.column,
    { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.lg },
    centered ? { gap: theme.space.md } : styles.columnFill,
    { maxWidth },
    style,
  ];

  if (centered) {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={column}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={column}>{children}</View>
    </View>
  );
}

/** En-têtes accordés au thème, à étaler dans `<Stack.Screen options>`. */
export function headerOptions(theme: Theme) {
  return {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.text,
    headerTitleStyle: { color: theme.colors.text, fontFamily: theme.text.heading.fontFamily },
    headerShadowVisible: false,
  };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  column: { width: '100%', alignSelf: 'center' },
  columnFill: { flex: 1 },
});
