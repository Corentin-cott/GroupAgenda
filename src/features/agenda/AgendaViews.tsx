import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { MonthCalendar } from '@/components/MonthCalendar';
import { SegmentedField } from '@/components/SegmentedField';
import { WeekCalendar } from '@/components/WeekCalendar';
import { usePreference } from '@/hooks/usePreference';
import { dayKey, formatDayLabel, parsePbDate, startOfDay, startOfWeek } from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { AgendaEntryCard } from './AgendaEntryCard';
import { buildDaySections } from './sections';
import type { AgendaEntry } from './types';

type ViewMode = 'list' | 'month' | 'week';

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'list', label: 'Liste' },
  { value: 'month', label: 'Mois' },
  { value: 'week', label: 'Semaine' },
];

const VIEW_MODES: readonly ViewMode[] = ['list', 'month', 'week'];

interface AgendaViewsProps {
  entries: AgendaEntry[];
  onRefresh?: () => void;
  emptyLabel?: string;
}

type EntryHref = Parameters<typeof router.push>[0];

function entryHref(entry: AgendaEntry): EntryHref | null {
  if (!entry.visible) return null;

  if (entry.source === 'personal') {
    return { pathname: '/personal/[eventId]', params: { eventId: entry.id } };
  }
  if (!entry.groupId) return null;

  return {
    pathname: '/group/[groupId]/event/[eventId]',
    params: { groupId: entry.groupId, eventId: entry.id },
  };
}

/** Liste, mois et semaine sur un jeu d'entrées, quelle que soit leur origine. */
export function AgendaViews({ entries, onRefresh, emptyLabel }: AgendaViewsProps) {
  const styles = useThemedStyles(createStyles);

  const [view, setView] = usePreference<ViewMode>('agenda_view', 'list', VIEW_MODES);
  const [showPast, setShowPast] = useState(false);
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const { sections, pastCount } = useMemo(
    () => buildDaySections(entries, (entry) => entry.start, showPast),
    [entries, showPast],
  );

  const entriesByDay = useMemo(() => {
    const map = new Map<string, AgendaEntry[]>();
    for (const entry of entries) {
      const date = parsePbDate(entry.start);
      if (!date) continue;
      const key = dayKey(date);
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  }, [entries]);

  const open = (entry: AgendaEntry) => {
    const href = entryHref(entry);
    if (href) router.push(href);
  };

  const selectedEntries = entriesByDay.get(dayKey(selectedDay)) ?? [];

  return (
    <>
      <View style={styles.switcher}>
        <SegmentedField value={view} options={VIEW_OPTIONS} onChange={setView} />
      </View>

      {view === 'list' && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} /> : undefined
          }
          ListHeaderComponent={
            pastCount > 0 ? (
              <Pressable onPress={() => setShowPast((previous) => !previous)} hitSlop={8}>
                <Text style={styles.toggle}>
                  {showPast
                    ? 'Masquer le passé'
                    : `Afficher ${pastCount} événement${pastCount > 1 ? 's' : ''} passé${pastCount > 1 ? 's' : ''}`}
                </Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>{emptyLabel ?? 'Aucun événement.'}</Text>}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.dayLabel, section.past && styles.dayLabelPast]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item, section }) => (
            <AgendaEntryCard
              entry={item}
              dimmed={section.past}
              onPress={entryHref(item) ? () => open(item) : undefined}
            />
          )}
        />
      )}

      {view === 'month' && (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} /> : undefined
          }
        >
          <MonthCalendar
            month={anchor}
            onMonthChange={setAnchor}
            selected={selectedDay}
            onSelect={setSelectedDay}
            markedDays={new Set(entriesByDay.keys())}
          />

          <Text style={styles.dayLabel}>{formatDayLabel(selectedDay)}</Text>
          {selectedEntries.length === 0 ? (
            <Text style={styles.empty}>Aucun événement ce jour.</Text>
          ) : (
            selectedEntries.map((entry) => (
              <AgendaEntryCard
                key={`${entry.source}-${entry.id}`}
                entry={entry}
                onPress={entryHref(entry) ? () => open(entry) : undefined}
              />
            ))
          )}
        </ScrollView>
      )}

      {view === 'week' && (
        <WeekCalendar
          weekStart={startOfWeek(anchor)}
          onWeekChange={setAnchor}
          entriesByDay={entriesByDay}
          onSelectEntry={open}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
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
  });
