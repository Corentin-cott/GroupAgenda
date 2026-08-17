import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';

interface AppErrorBoundaryProps {
  error: Error;
  retry: () => Promise<void>;
}

// Palette figée : ce composant remplace tout l'arbre, providers de thème compris.
const palettes = {
  light: { background: '#FAF9F7', surface: '#FFFFFF', text: '#1B1A1F', muted: '#6F6A78', accent: '#5B4BE0', onAccent: '#FFFFFF' },
  dark: { background: '#131218', surface: '#1C1B23', text: '#F4F2EF', muted: '#A29DAE', accent: '#9187FF', onAccent: '#15131F' },
};

export function AppErrorBoundary({ error, retry }: AppErrorBoundaryProps) {
  const colors = useColorScheme() === 'dark' ? palettes.dark : palettes.light;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.column}>
        <Text style={[styles.title, { color: colors.text }]}>Quelque chose a cassé</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          L'application a rencontré une erreur inattendue. Réessayer suffit le plus souvent.
        </Text>

        <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={retry}>
          <Text style={[styles.buttonLabel, { color: colors.onAccent }]}>Réessayer</Text>
        </Pressable>

        <Text style={[styles.detail, { color: colors.muted, backgroundColor: colors.surface }]}>
          {error.message}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  column: { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 12 },
  title: { fontSize: 27, fontWeight: '600' },
  meta: { fontSize: 14, lineHeight: 20 },
  button: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 8,
  },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
  detail: { fontSize: 12, lineHeight: 18, borderRadius: 8, padding: 12, marginTop: 8 },
});
