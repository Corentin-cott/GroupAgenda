import { StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SegmentedField } from '@/components/SegmentedField';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import { themeOptions } from '@/theme/themes';
import type { Theme } from '@/theme/tokens';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { themeId, setThemeId } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Réglages' }} />

      <View style={styles.identity}>
        <Text style={styles.name}>{user?.name || user?.email}</Text>
        {!!user?.name && <Text style={styles.meta}>{user.email}</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        <Text style={styles.meta}>
          Chaque thème règle d'un coup les couleurs, la typographie et la densité.
        </Text>
        <SegmentedField vertical value={themeId} options={themeOptions} onChange={setThemeId} />
      </View>

      <PrimaryButton
        label="Se déconnecter"
        variant="outline"
        style={styles.signOut}
        onPress={() => {
          signOut();
          router.replace('/login');
        }}
      />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    identity: { gap: 2, marginBottom: theme.space.lg },
    name: theme.text.title,
    meta: theme.text.meta,
    section: { gap: theme.space.sm, flex: 1 },
    sectionTitle: theme.text.heading,
    signOut: { marginTop: theme.space.lg },
  });
