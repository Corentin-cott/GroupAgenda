import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Formulaire court sans en-tête : centré verticalement, défilable si la fenêtre est basse. */
  centered?: boolean;
  /** Contenu aligné en haut mais défilable : formulaires sous un en-tête. */
  scrollable?: boolean;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/** Colonne centrée et bornée. Au flex, pas au breakpoint JS : celui-ci ne suit pas le redimensionnement web. */
export function Screen({
  children,
  centered = false,
  scrollable = false,
  maxWidth = 720,
  style,
}: ScreenProps) {
  const { theme } = useTheme();

  const column: StyleProp<ViewStyle> = [
    styles.column,
    { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.lg },
    centered && { gap: theme.space.md },
    !centered && !scrollable && styles.columnFill,
    { maxWidth },
    style,
  ];

  if (centered || scrollable) {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={centered ? styles.scrollCentered : styles.scrollTop}
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
  scrollCentered: { flexGrow: 1, justifyContent: 'center' },
  scrollTop: { flexGrow: 1 },
  column: { width: '100%', alignSelf: 'center' },
  columnFill: { flex: 1 },
});
