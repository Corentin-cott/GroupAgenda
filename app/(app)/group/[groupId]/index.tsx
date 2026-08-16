import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { HeaderButton } from '@/components/HeaderButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { UserPlusIcon } from '@/components/icons';
import { useGroupEvents } from '@/hooks/useGroupEvents';
import { useGroupRsvpSummary } from '@/hooks/useGroupRsvpSummary';
import { formatEventDate } from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function GroupAgendaScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { events, isLoading, error, refresh } = useGroupEvents(groupId);
  const rsvpSummary = useGroupRsvpSummary(groupId);
  const styles = useThemedStyles(createStyles);

  const screenOptions = {
    title: 'Agenda',
    headerRight: () => (
      <HeaderButton
        onPress={() => router.push(`/group/${groupId}/invite`)}
        accessibilityLabel="Inviter quelqu'un dans le groupe"
      >
        {(color) => <UserPlusIcon color={color} />}
      </HeaderButton>
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
          const { count, attending } = rsvpSummary[item.id] ?? { count: 0, attending: false };
          return (
            <Card onPress={() => router.push(`/group/${groupId}/event/${item.id}`)}>
              <View style={styles.row}>
                <Text style={styles.title}>{item.title}</Text>
                {attending && (
                  <View style={styles.check} accessibilityLabel="Tu es inscrit à cet événement">
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </View>
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
    list: { gap: theme.space.sm },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.sm },
    title: { ...theme.text.heading, flex: 1 },
    check: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accent,
    },
    checkMark: {
      fontFamily: theme.text.body.fontFamily,
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onAccent,
    },
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
