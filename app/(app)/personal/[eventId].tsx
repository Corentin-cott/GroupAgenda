import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PersonalEventForm } from '@/features/personal/PersonalEventForm';
import {
  deletePersonalEvent,
  getPersonalEvent,
  updatePersonalEvent,
} from '@/features/personal/api';
import { confirmAction } from '@/lib/confirm';
import { formatEventDate, parsePbDate } from '@/lib/date';
import { pbErrorMessage } from '@/lib/errors';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { PersonalEventRecord } from '@/types/pocketbase';

export default function PersonalEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const styles = useThemedStyles(createStyles);

  const [event, setEvent] = useState<PersonalEventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let active = true;

    void (async () => {
      try {
        const record = await getPersonalEvent(eventId);
        if (active) setEvent(record);
      } catch (err) {
        if (active) setError(pbErrorMessage(err, 'Cet événement est introuvable.'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [eventId]);

  const onDelete = async () => {
    if (!eventId) return;
    const confirmed = await confirmAction(
      'Supprimer cet événement ?',
      'Il disparaîtra de ton agenda. Cette action est définitive.',
    );
    if (!confirmed) return;

    try {
      await deletePersonalEvent(eventId);
      router.replace('/agenda');
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de supprimer cet événement.'));
    }
  };

  if (isLoading) {
    return (
      <Screen centered>
        <Stack.Screen options={{ title: 'Événement' }} />
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!event) {
    return (
      <Screen centered>
        <Stack.Screen options={{ title: 'Événement' }} />
        <Text style={styles.error}>{error ?? 'Cet événement est introuvable.'}</Text>
      </Screen>
    );
  }

  if (isEditing) {
    return (
      <Screen scrollable maxWidth={520}>
        <Stack.Screen options={{ title: "Modifier l'événement" }} />

        <PersonalEventForm
          submitLabel="Enregistrer"
          initial={{
            title: event.title,
            startDate: parsePbDate(event.start_date) ?? new Date(),
          }}
          onSubmit={async (input) => {
            setEvent(await updatePersonalEvent(event.id, input));
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Événement' }} />

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.date}>{formatEventDate(event.start_date)}</Text>
      <Text style={styles.meta}>
        Événement personnel. Les autres membres voient un créneau occupé, sans le titre.
      </Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Pressable onPress={() => setIsEditing(true)} hitSlop={8}>
          <Text style={styles.action}>Modifier</Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Text style={[styles.action, styles.danger]}>Supprimer</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    title: theme.text.title,
    date: { ...theme.text.body, marginTop: theme.space.sm },
    meta: { ...theme.text.meta, marginTop: theme.space.xs },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space.lg,
      marginTop: theme.space.xl,
    },
    action: { ...theme.text.body, color: theme.colors.accent },
    danger: { color: theme.colors.danger },
    error: { ...theme.text.body, color: theme.colors.danger, marginTop: theme.space.md },
  });
