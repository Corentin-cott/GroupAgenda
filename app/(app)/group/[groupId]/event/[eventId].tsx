import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { EventForm } from '@/features/events/EventForm';
import { deleteEvent, getEvent, updateEvent } from '@/features/events/api';
import { useEventRsvps } from '@/hooks/useEventRsvps';
import { confirmAction } from '@/lib/confirm';
import { formatEventDate, parsePbDate } from '@/lib/date';
import { pbErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { EventRecord, RsvpRecord, UserRecord } from '@/types/pocketbase';

function participantLabel(rsvp: RsvpRecord, currentUser: UserRecord | null): string {
  const expanded = rsvp.expand?.user;

  if (currentUser && rsvp.user === currentUser.id) {
    return `${currentUser.name || expanded?.name || currentUser.email} (Toi)`;
  }
  return expanded?.name || expanded?.email || 'Un membre';
}

/** La session porte notre propre enregistrement même si l'`expand` ne le renvoie pas. */
function participantUser(rsvp: RsvpRecord, currentUser: UserRecord | null): UserRecord | null {
  if (currentUser && rsvp.user === currentUser.id) return currentUser;
  return rsvp.expand?.user ?? null;
}

export default function EventDetailScreen() {
  const { groupId, eventId } = useLocalSearchParams<{ groupId: string; eventId: string }>();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);

  const [event, setEvent] = useState<EventRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { participants, isAttending, isPending, toggle } = useEventRsvps(
    event?.type === 'rsvp' ? eventId : undefined,
  );

  useEffect(() => {
    if (!eventId) return;
    let active = true;

    void (async () => {
      try {
        const record = await getEvent(eventId);
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
      'Il disparaîtra pour tous les membres du groupe. Cette action est définitive.',
    );
    if (!confirmed) return;

    try {
      await deleteEvent(eventId);
      router.replace(`/group/${groupId}`);
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
      <Screen centered maxWidth={480}>
        <Stack.Screen options={{ title: 'Modifier' }} />
        <Text style={styles.title}>Modifier l'événement</Text>

        <EventForm
          submitLabel="Enregistrer"
          initial={{
            title: event.title,
            startDate: parsePbDate(event.start_date) ?? new Date(),
            type: event.type,
          }}
          onSubmit={async (input) => {
            const updated = await updateEvent(event.id, event.group, input);
            setEvent(updated);
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
        Proposé par {event.expand?.creator?.name || event.expand?.creator?.email || 'un membre'}
      </Text>

      {event.type === 'rsvp' && (
        <View style={styles.section}>
          <PrimaryButton
            label={isAttending ? 'Je ne viens plus' : 'Je viens'}
            variant={isAttending ? 'outline' : 'solid'}
            onPress={toggle}
            pending={isPending}
          />

          <Text style={styles.sectionTitle}>
            {participants.length} inscrit{participants.length > 1 ? 's' : ''}
          </Text>
          {participants.length === 0 ? (
            <Text style={styles.meta}>Personne pour l'instant.</Text>
          ) : (
            participants.map((rsvp) => (
              <View key={rsvp.id} style={styles.participantRow}>
                <Avatar user={participantUser(rsvp, user)} size={32} />
                <Text style={styles.participant}>{participantLabel(rsvp, user)}</Text>
              </View>
            ))
          )}
        </View>
      )}

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
    section: {
      gap: theme.space.sm,
      marginTop: theme.space.xl,
      paddingTop: theme.space.lg,
      borderTopWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.separator,
    },
    sectionTitle: { ...theme.text.heading, marginTop: theme.space.sm },
    participantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space.md,
      paddingVertical: theme.space.xs,
    },
    participant: { ...theme.text.body, flex: 1 },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space.lg,
      marginTop: theme.space.xl,
    },
    action: { ...theme.text.body, color: theme.colors.accent },
    danger: { color: theme.colors.danger },
    error: { ...theme.text.body, color: theme.colors.danger, textAlign: 'center' },
  });
