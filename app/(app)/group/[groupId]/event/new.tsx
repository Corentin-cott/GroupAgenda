import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EventForm } from '@/features/events/EventForm';
import { createEvent } from '@/features/events/api';
import { useAuth } from '@/providers/AuthProvider';

export default function NewEventScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();

  if (!groupId || !user) return null;

  return (
    <Screen scrollable maxWidth={520}>
      <Stack.Screen options={{ title: 'Nouvel événement' }} />

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
