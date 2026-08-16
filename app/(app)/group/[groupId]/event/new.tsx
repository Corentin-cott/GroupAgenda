import { StyleSheet, Text } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EventForm } from '@/features/events/EventForm';
import { createEvent } from '@/features/events/api';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function NewEventScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);

  if (!groupId || !user) return null;

  return (
    <Screen centered maxWidth={480}>
      <Stack.Screen options={{ title: 'Nouvel événement' }} />

      <Text style={styles.title}>Nouvel événement</Text>

      <EventForm
        submitLabel="Créer l'événement"
        onSubmit={async (input) => {
          await createEvent(groupId, user.id, input);
          router.replace(`/group/${groupId}`);
        }}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    title: theme.text.title,
  });
