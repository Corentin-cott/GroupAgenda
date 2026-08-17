import { StyleSheet, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
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
    <Screen scrollable maxWidth={520}>
      <Stack.Screen options={{ title: 'Réglages' }} />

      <Card onPress={() => router.push('/profile')} style={styles.identity}>
        <Avatar user={user} size={48} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{user?.name || user?.email}</Text>
          <Text style={styles.meta}>Modifier le profil</Text>
        </View>
      </Card>

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
    identity: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
    identityText: { flex: 1, gap: 2 },
    name: theme.text.heading,
    meta: theme.text.meta,
    section: { gap: theme.space.sm, marginTop: theme.space.lg },
    sectionTitle: theme.text.heading,
    signOut: { marginTop: theme.space.lg },
  });
