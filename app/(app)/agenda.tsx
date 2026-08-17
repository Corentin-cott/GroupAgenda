import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { AgendaViews } from '@/features/agenda/AgendaViews';
import { fetchOwnAgenda } from '@/features/agenda/api';
import type { AgendaEntry } from '@/features/agenda/types';
import { useAppForeground } from '@/hooks/useAppForeground';
import { pbErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function MyAgendaScreen() {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [entries, setEntries] = useState<AgendaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setEntries(await fetchOwnAgenda(user.id));
      setError(null);
    } catch (err) {
      setError(pbErrorMessage(err, "Impossible de charger l'agenda."));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useAppForeground(load);

  if (isLoading) {
    return (
      <Screen centered>
        <Stack.Screen options={{ title: 'Mon agenda' }} />
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Mon agenda' }} />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <AgendaViews
        entries={entries}
        onRefresh={load}
        emptyLabel="Rien de prévu. Les événements de tes groupes apparaissent ici automatiquement."
      />

      <PrimaryButton
        label="Nouvel événement personnel"
        onPress={() => router.push('/personal/new')}
        style={styles.cta}
      />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    error: { ...theme.text.meta, color: theme.colors.danger, marginBottom: theme.space.sm },
    cta: { marginTop: theme.space.md },
  });
