import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

interface ScreenProps {
  children: ReactNode;
  /** Formulaire court : centré verticalement, et défilable si la fenêtre est trop basse. */
  centered?: boolean;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Colonne fluide, bornée en largeur et centrée. Le dimensionnement est laissé
 * au flex plutôt qu'à un breakpoint lu en JS : `useWindowDimensions` comme
 * `onLayout` donnent la bonne valeur au montage mais ne rafraîchissent pas au
 * redimensionnement de la fenêtre web.
 */
export function Screen({ children, centered = false, maxWidth = 720, style }: ScreenProps) {
  if (centered) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.column, styles.columnCentered, { maxWidth }, style]}>{children}</View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.column, styles.columnFill, { maxWidth }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  column: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  columnFill: { flex: 1 },
  columnCentered: { gap: 12 },
});
