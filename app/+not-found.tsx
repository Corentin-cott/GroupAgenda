import { StyleSheet, Text } from 'react-native';
import { Stack, router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function NotFoundScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <Screen centered maxWidth={420}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.title}>Page introuvable</Text>
      <Text style={styles.meta}>
        Cette adresse ne correspond à rien. Le lien est peut-être incomplet, ou le contenu a été
        supprimé.
      </Text>

      <PrimaryButton label="Retour à l'accueil" onPress={() => router.replace('/')} />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    title: { ...theme.text.title, textAlign: 'center' },
    meta: { ...theme.text.meta, textAlign: 'center', marginBottom: theme.space.sm },
  });
