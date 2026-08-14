import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useGroupEvents } from '@/hooks/useGroupEvents';
import { parsePbDate } from '@/lib/date';
import { colors } from '@/theme/colors';

export default function GroupAgendaScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { events, isLoading, error, refresh } = useGroupEvents(groupId);

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
});
