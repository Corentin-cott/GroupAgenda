import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useGroupEvents } from '@/hooks/useGroupEvents';
import { useGroupRsvpCounts } from '@/hooks/useGroupRsvpCounts';
import { formatEventDate } from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function GroupAgendaScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { events, isLoading, error, refresh } = useGroupEvents(groupId);
  const rsvpCounts = useGroupRsvpCounts(groupId);
  const styles = useThemedStyles(createStyles);

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
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun événement pour l'instant.</Text>}
        renderItem={({ item }) => {
          const count = rsvpCounts[item.id] ?? 0;
          return (
            <Card onPress={() => router.push(`/group/${groupId}/event/${item.id}`)}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{formatEventDate(item.start_date)}</Text>
              {item.type === 'rsvp' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeLabel}>
                    {count} inscrit{count > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </Card>
          );
        }}
      />

      <PrimaryButton
        label="Nouvel événement"
        onPress={() => router.push(`/group/${groupId}/event/new`)}
        style={styles.cta}
      />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    headerAction: { ...theme.text.body, color: theme.colors.accent },
    list: { gap: theme.space.sm },
    title: theme.text.heading,
    meta: theme.text.meta,
    badge: {
      alignSelf: 'flex-start',
      marginTop: theme.space.xs + 2,
      backgroundColor: theme.colors.accentSoft,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.space.sm,
      paddingVertical: 3,
    },
    badgeLabel: { ...theme.text.label, color: theme.colors.accent },
    empty: { ...theme.text.meta, textAlign: 'center', marginTop: theme.space.xl },
    error: { ...theme.text.body, color: theme.colors.danger, textAlign: 'center' },
    cta: { marginTop: theme.space.md },
  });
