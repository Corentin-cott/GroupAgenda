import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

/** Marque d'inscription, commune aux cartes d'agenda de groupe et personnelles. */
export function AttendingCheck() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.check} accessibilityLabel="Tu es inscrit à cet événement">
      <Text style={styles.mark}>✓</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    check: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
    },
    mark: {
      fontFamily: theme.text.body.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onAccent,
    },
  });
