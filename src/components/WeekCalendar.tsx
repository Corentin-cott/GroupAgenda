import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
}

/**
 * Sept colonnes de largeur minimale : elles s'étalent sur grand écran et
 * défilent horizontalement sur téléphone, sans breakpoint lu en JS.
 */
export function WeekCalendar({
  weekStart,
  onWeekChange,
  eventsByDay,
  attendingIds,
  onSelectEvent,
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

      <ScrollView horizontal contentContainerStyle={styles.grid} showsHorizontalScrollIndicator>
        {days.map((day) => {
          const key = dayKey(day);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isToday = key === todayKey;

          return (
            <View key={key} style={[styles.column, isToday && styles.columnToday]}>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text style={[styles.dayNumber, isToday && styles.dayLabelToday]}>
                {day.getDate()}
              </Text>

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
                      <Text style={styles.chipTime}>
                        {date ? formatTime(date) : '—'}
                        {attendingIds.has(event.id) ? ' ✓' : ''}
                      </Text>
                      <Text style={styles.chipTitle} numberOfLines={3}>
                        {event.title}
                      </Text>
                    </Pressable>
                  );
                })
              )}
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
      backgroundColor: theme.colors.surface,
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.space.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.space.sm,
      paddingBottom: theme.space.sm,
    },
    rangeLabel: theme.text.heading,
    grid: { flexGrow: 1 },
    column: {
      flex: 1,
      minWidth: 96,
      paddingHorizontal: 3,
      paddingBottom: theme.space.xs,
      gap: 3,
      borderLeftWidth: Math.max(theme.borderWidth, 1),
      borderLeftColor: theme.colors.separator,
    },
    columnToday: { backgroundColor: theme.colors.accentSoft, borderRadius: theme.radius.sm },
    dayLabel: { ...theme.text.label, textAlign: 'center', textTransform: 'capitalize' },
    dayNumber: { ...theme.text.body, textAlign: 'center', marginBottom: theme.space.xs },
    dayLabelToday: { color: theme.colors.accent, fontWeight: '700' },
    emptyDay: { ...theme.text.meta, textAlign: 'center' },
    chip: {
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.sm,
      paddingHorizontal: theme.space.sm,
      paddingVertical: theme.space.xs,
    },
    chipTime: { ...theme.text.label, color: theme.colors.accent },
    chipTitle: { ...theme.text.meta, color: theme.colors.text },
  });
