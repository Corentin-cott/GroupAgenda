import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useGroupEvents } from '@/hooks/useGroupEvents';
import { useGroupRsvpCounts } from '@/hooks/useGroupRsvpCounts';
import { formatEventDate } from '@/lib/date';
import { colors } from '@/theme/colors';

export default function GroupAgendaScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { events, isLoading, error, refresh } = useGroupEvents(groupId);
  const rsvpCounts = useGroupRsvpCounts(groupId);

  const screenOptions = {
    title: 'Agenda',
    headerRight: () => (
      <Link href={`/group/${groupId}/invite`} style={styles.headerAction}>
        Inviter
      </Link>
    ),
  };

  if (isLoading || error) {
    return (
      <Screen centered>
        <Stack.Screen options={screenOptions} />
        {error ? (
          <Text style={styles.error}>Impossible de charger l'agenda.</Text>
        ) : (
          <ActivityIndicator />
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={screenOptions} />

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun événement pour l'instant.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => router.push(`/group/${groupId}/event/${item.id}`)}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {formatEventDate(item.start_date)}
              {item.type === 'rsvp' && ` · ${rsvpCounts[item.id] ?? 0} inscrit${(rsvpCounts[item.id] ?? 0) > 1 ? 's' : ''}`}
            </Text>
          </Pressable>
        )}
      />

      <PrimaryButton
        label="Nouvel événement"
        onPress={() => router.push(`/group/${groupId}/event/new`)}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { color: colors.accent },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  title: { fontSize: 16, fontWeight: '500', color: colors.text },
  meta: { color: colors.muted, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 32, color: colors.muted },
  error: { color: colors.danger, textAlign: 'center' },
  cta: { marginTop: 12 },
});
