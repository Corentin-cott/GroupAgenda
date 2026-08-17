import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { HeaderButton } from '@/components/HeaderButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { UserPlusIcon, UsersIcon } from '@/components/icons';
import { useGroupEvents } from '@/hooks/useGroupEvents';
import { useGroupRsvpSummary } from '@/hooks/useGroupRsvpSummary';
import { dayKey, formatDayLabel, formatTime, parsePbDate, startOfDay } from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { EventRecord } from '@/types/pocketbase';

interface DaySection {
  key: string;
  title: string;
  past: boolean;
  data: EventRecord[];
}

function buildSections(events: EventRecord[], includePast: boolean) {
  const today = startOfDay(new Date()).getTime();
  const sections: DaySection[] = [];
  let pastCount = 0;

  for (const event of events) {
    const date = parsePbDate(event.start_date);
    if (!date) continue;

    const past = startOfDay(date).getTime() < today;
    if (past) pastCount += 1;
    if (past && !includePast) continue;

    const key = dayKey(date);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(event);
    else sections.push({ key, title: formatDayLabel(date), past, data: [event] });
  }

  return { sections, pastCount };
}

export default function GroupAgendaScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { events, isLoading, error, refresh } = useGroupEvents(groupId);
  const rsvpSummary = useGroupRsvpSummary(groupId);
  const styles = useThemedStyles(createStyles);
  const [showPast, setShowPast] = useState(false);

  const { sections, pastCount } = useMemo(
    () => buildSections(events, showPast),
    [events, showPast],
  );

  const screenOptions = {
    title: 'Agenda',
    headerRight: () => (
      <View style={styles.headerActions}>
        <HeaderButton
          compact
          onPress={() => router.push(`/group/${groupId}/members`)}
          accessibilityLabel="Voir les membres du groupe"
        >
          {(color) => <UsersIcon color={color} />}
        </HeaderButton>
        <HeaderButton
          onPress={() => router.push(`/group/${groupId}/invite`)}
          accessibilityLabel="Inviter quelqu'un dans le groupe"
        >
          {(color) => <UserPlusIcon color={color} />}
        </HeaderButton>
      </View>
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

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        ListHeaderComponent={
          pastCount > 0 ? (
            <Pressable onPress={() => setShowPast((previous) => !previous)} hitSlop={8}>
              <Text style={styles.toggle}>
                {showPast
                  ? 'Masquer les événements passés'
                  : `Afficher ${pastCount} événement${pastCount > 1 ? 's' : ''} passé${pastCount > 1 ? 's' : ''}`}
              </Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun événement à venir.</Text>}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.dayLabel, section.past && styles.dayLabelPast]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item, section }) => {
          const { count, attending } = rsvpSummary[item.id] ?? { count: 0, attending: false };
          const date = parsePbDate(item.start_date);
          return (
            <Card
              onPress={() => router.push(`/group/${groupId}/event/${item.id}`)}
              style={section.past ? styles.cardPast : undefined}
            >
              <View style={styles.row}>
                <Text style={styles.title}>{item.title}</Text>
                {attending && (
                  <View style={styles.check} accessibilityLabel="Tu es inscrit à cet événement">
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.meta}>{date ? formatTime(date) : 'Heure à définir'}</Text>
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
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    list: { gap: theme.space.sm, paddingBottom: theme.space.sm },
    toggle: { ...theme.text.meta, color: theme.colors.accent, paddingVertical: theme.space.xs },
    dayLabel: {
      ...theme.text.label,
      textTransform: 'capitalize',
      color: theme.colors.text,
      marginTop: theme.space.md,
    },
    dayLabelPast: { color: theme.colors.textMuted },
    cardPast: { opacity: 0.6 },
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
