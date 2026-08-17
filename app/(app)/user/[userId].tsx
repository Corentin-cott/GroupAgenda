import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AgendaViews } from '@/features/agenda/AgendaViews';
import { fetchUserAgenda } from '@/features/agenda/api';
import type { AgendaEntry } from '@/features/agenda/types';
import { pbErrorMessage } from '@/lib/errors';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function UserAgendaScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const styles = useThemedStyles(createStyles);

  const [entries, setEntries] = useState<AgendaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setEntries(await fetchUserAgenda(userId));
      setError(null);
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de charger cet agenda.'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = name ? `Agenda de ${name}` : 'Agenda';

  if (isLoading) {
    return (
      <Screen centered>
        <Stack.Screen options={{ title }} />
        <ActivityIndicator />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen centered>
        <Stack.Screen options={{ title }} />
        <Text style={styles.error}>{error}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title }} />

      <Text style={styles.hint}>
        Seuls les événements auxquels {name ?? 'cette personne'} s'est inscrit apparaissent. Ceux
        des groupes que vous ne partagez pas restent sans détail.
      </Text>

      <AgendaViews
        entries={entries}
        onRefresh={load}
        emptyLabel="Rien de prévu, ou rien de visible pour toi."
      />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    hint: { ...theme.text.meta, marginBottom: theme.space.sm },
    error: { ...theme.text.body, color: theme.colors.danger, textAlign: 'center' },
  });
