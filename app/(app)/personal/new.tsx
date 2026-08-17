import { Stack, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { PersonalEventForm } from '@/features/personal/PersonalEventForm';
import { createPersonalEvent } from '@/features/personal/api';
import { useAuth } from '@/providers/AuthProvider';

export default function NewPersonalEventScreen() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Screen scrollable maxWidth={520}>
      <Stack.Screen options={{ title: 'Événement personnel' }} />

      <PersonalEventForm
        submitLabel="Créer l'événement"
        onSubmit={async (input) => {
          await createPersonalEvent(user.id, input);
          router.replace('/agenda');
        }}
        onCancel={() => router.back()}
      />
    </Screen>
  );
}
