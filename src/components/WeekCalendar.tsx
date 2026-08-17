import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { addDays, dayKey, formatTime, parsePbDate } from '@/lib/date';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { EventRecord } from '@/types/pocketbase';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface WeekCalendarProps {
  weekStart: Date;
  onWeekChange: (weekStart: Date) => void;
  eventsByDay: Map<string, EventRecord[]>;
  attendingIds: Set<string>;
  onSelectEvent: (event: EventRecord) => void;
  onRefresh?: () => void;
}

/** Sept jours empilés, la navigation restant fixe au-dessus du défilement. */
export function WeekCalendar({
  weekStart,
  onWeekChange,
  eventsByDay,
  attendingIds,
  onSelectEvent,
  onRefresh,
}: WeekCalendarProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const todayKey = dayKey(new Date());
  const last = days[6]!;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Pressable
          onPress={() => onWeekChange(addDays(weekStart, -7))}
          hitSlop={10}
          accessibilityLabel="Semaine précédente"
        >
          <ChevronLeftIcon color={theme.colors.accent} size={20} />
        </Pressable>

        <Text style={styles.rangeLabel}>
          {weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} –{' '}
          {last.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </Text>

        <Pressable
          onPress={() => onWeekChange(addDays(weekStart, 7))}
          hitSlop={10}
          accessibilityLabel="Semaine suivante"
        >
          <ChevronRightIcon color={theme.colors.accent} size={20} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.days}
        contentContainerStyle={styles.daysContent}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} /> : undefined
        }
      >
        {days.map((day) => {
          const key = dayKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;

          return (
          <View key={key} style={[styles.day, isToday && styles.dayToday]}>
            <View style={styles.dayHead}>
              <Text style={[styles.dayName, isToday && styles.todayText]}>
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayNumber, isToday && styles.todayText]}>{day.getDate()}</Text>
            </View>

            <View style={styles.dayEvents}>
              {dayEvents.length === 0 ? (
                <Text style={styles.emptyDay}>—</Text>
              ) : (
                dayEvents.map((event) => {
                  const date = parsePbDate(event.start_date);
                  return (
                    <Pressable
                      key={event.id}
                      style={styles.chip}
                      onPress={() => onSelectEvent(event)}
                    >
                      <Text style={styles.chipTime}>{date ? formatTime(date) : '—'}</Text>
                      <Text style={styles.chipTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      {attendingIds.has(event.id) && <Text style={styles.chipCheck}>✓</Text>}
                    </Pressable>
                  );
                })
              )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.space.sm,
    },
    days: { flex: 1 },
    daysContent: { paddingBottom: theme.space.xs },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.space.sm,
      paddingBottom: theme.space.sm,
    },
    rangeLabel: theme.text.heading,
    day: {
      flexDirection: 'row',
      gap: theme.space.md,
      paddingVertical: theme.space.sm,
      paddingHorizontal: theme.space.sm,
      borderTopWidth: Math.max(theme.borderWidth, 1),
      borderTopColor: theme.colors.separator,
    },
    dayToday: { backgroundColor: theme.colors.accentSoft, borderRadius: theme.radius.sm },
    dayHead: { width: 44, alignItems: 'center' },
    dayName: { ...theme.text.label, textTransform: 'capitalize' },
    dayNumber: { ...theme.text.heading, color: theme.colors.text },
    todayText: { color: theme.colors.accent },
    dayEvents: { flex: 1, gap: theme.space.xs, justifyContent: 'center' },
    emptyDay: theme.text.meta,
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space.sm,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.space.sm,
      paddingVertical: theme.space.xs + 2,
    },
    chipTime: { ...theme.text.label, color: theme.colors.accent },
    chipTitle: { ...theme.text.meta, color: theme.colors.text, flex: 1 },
    chipCheck: { ...theme.text.label, color: theme.colors.accent, fontWeight: '700' },
  });
