import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useGroupEvents } from '@/hooks/useGroupEvents';
import { parsePbDate } from '@/lib/date';

export default function GroupAgendaScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { events, isLoading, error, refresh } = useGroupEvents(groupId);

  if (isLoading || error) {
    return (
      <Screen centered>
        <Stack.Screen options={{ title: 'Agenda' }} />
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
      <Stack.Screen options={{ title: 'Agenda' }} />
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun événement.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {parsePbDate(item.start_date)?.toLocaleString() ?? 'Date à définir'}
              {item.type === 'rsvp' ? ' · inscription requise' : ''}
            </Text>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ddd' },
  title: { fontSize: 16, fontWeight: '500' },
  meta: { color: '#666', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' },
  error: { color: '#c0392b', textAlign: 'center' },
});
