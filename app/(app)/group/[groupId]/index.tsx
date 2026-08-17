import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { HeaderButton } from '@/components/HeaderButton';
import { MonthCalendar } from '@/components/MonthCalendar';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SegmentedField } from '@/components/SegmentedField';
import { WeekCalendar } from '@/components/WeekCalendar';
import { UserPlusIcon, UsersIcon } from '@/components/icons';
import { EventCard } from '@/features/events/EventCard';
import { useGroupEvents } from '@/hooks/useGroupEvents';
import { useGroupRsvpSummary } from '@/hooks/useGroupRsvpSummary';
import { usePreference } from '@/hooks/usePreference';
import {
  dayKey,
  formatDayLabel,
  parsePbDate,
  startOfDay,
  startOfWeek,
} from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { EventRecord } from '@/types/pocketbase';

type ViewMode = 'list' | 'month' | 'week';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'list', label: 'Liste' },
  { value: 'month', label: 'Mois' },
  { value: 'week', label: 'Semaine' },
];

const VIEW_MODES: readonly ViewMode[] = ['list', 'month', 'week'];

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

  const [view, setView] = usePreference<ViewMode>('agenda_view', 'list', VIEW_MODES);
  const [showPast, setShowPast] = useState(false);
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const { sections, pastCount } = useMemo(
    () => buildSections(events, showPast),
    [events, showPast],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRecord[]>();
    for (const event of events) {
      const date = parsePbDate(event.start_date);
      if (!date) continue;
      const key = dayKey(date);
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  const attendingIds = useMemo(
    () =>
      new Set(
        Object.entries(rsvpSummary)
          .filter(([, summary]) => summary.attending)
          .map(([eventId]) => eventId),
      ),
    [rsvpSummary],
  );

  const openEvent = (event: EventRecord) => router.push(`/group/${groupId}/event/${event.id}`);

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

  const selectedEvents = eventsByDay.get(dayKey(selectedDay)) ?? [];

  return (
    <Screen>
      <Stack.Screen options={screenOptions} />

      <View style={styles.switcher}>
        <SegmentedField value={view} options={VIEW_OPTIONS} onChange={setView} />
      </View>

      {view === 'list' && (
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
          renderItem={({ item, section }) => (
            <EventCard
              event={item}
              summary={rsvpSummary[item.id]}
              dimmed={section.past}
              onPress={() => openEvent(item)}
            />
          )}
        />
      )}

      {view === 'month' && (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        >
          <MonthCalendar
            month={anchor}
            onMonthChange={setAnchor}
            selected={selectedDay}
            onSelect={setSelectedDay}
            markedDays={new Set(eventsByDay.keys())}
          />

          <Text style={styles.dayLabel}>{formatDayLabel(selectedDay)}</Text>
          {selectedEvents.length === 0 ? (
            <Text style={styles.empty}>Aucun événement ce jour.</Text>
          ) : (
            selectedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                summary={rsvpSummary[event.id]}
                onPress={() => openEvent(event)}
              />
            ))
          )}
        </ScrollView>
      )}

      {view === 'week' && (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        >
          <WeekCalendar
            weekStart={startOfWeek(anchor)}
            onWeekChange={setAnchor}
            eventsByDay={eventsByDay}
            attendingIds={attendingIds}
            onSelectEvent={openEvent}
          />
        </ScrollView>
      )}

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
    switcher: { marginBottom: theme.space.md },
    list: { gap: theme.space.sm, paddingBottom: theme.space.sm },
    toggle: { ...theme.text.meta, color: theme.colors.accent, paddingVertical: theme.space.xs },
    dayLabel: {
      ...theme.text.label,
      textTransform: 'capitalize',
      color: theme.colors.text,
      marginTop: theme.space.md,
    },
    dayLabelPast: { color: theme.colors.textMuted },
    empty: { ...theme.text.meta, textAlign: 'center', marginTop: theme.space.xl },
    error: { ...theme.text.body, color: theme.colors.danger, textAlign: 'center' },
    cta: { marginTop: theme.space.md },
  });
