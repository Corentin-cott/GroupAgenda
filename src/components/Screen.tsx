import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

interface ScreenProps {
  children: ReactNode;
  /** Centre le contenu verticalement (écrans courts : login, invitation). */
  centered?: boolean;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Colonne fluide, bornée en largeur et centrée : pleine largeur, une liste
 * devient illisible sur un écran de bureau.
 *
 * Le dimensionnement est laissé au flex plutôt qu'à un breakpoint lu en JS :
 * `useWindowDimensions` comme `onLayout` donnent la bonne valeur au montage
 * mais ne rafraîchissent pas au redimensionnement de la fenêtre web.
 */
export function Screen({ children, centered = false, maxWidth = 720, style }: ScreenProps) {
  return (
    <View style={[styles.root, centered && styles.centered]}>
      <View style={[styles.content, { maxWidth }, centered && styles.contentCentered, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { justifyContent: 'center' },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contentCentered: { flex: 0, gap: 12 },
});
