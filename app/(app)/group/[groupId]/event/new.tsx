import { StyleSheet, Text } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EventForm } from '@/features/events/EventForm';
import { createEvent } from '@/features/events/api';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme/colors';

export default function NewEventScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();

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

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '600', color: colors.text },
});
