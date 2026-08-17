import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { dayKey, startOfDay } from '@/lib/date';
import { useTheme, useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface MonthCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  selected: Date;
  onSelect: (day: Date) => void;
  /** Clés `dayKey` des journées qui portent au moins un événement. */
  markedDays: Set<string>;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Semaines du mois, complétées par des `null` pour les cases hors mois. */
function buildWeeks(month: Date): (Date | null)[][] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const daysInMonth = new Date(year, index + 1, 0).getDate();
  // getDay() place dimanche à 0 ; on veut les semaines commençant lundi.
  const offset = (new Date(year, index, 1).getDay() + 6) % 7;

  const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, index, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function MonthCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  markedDays,
}: MonthCalendarProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const weeks = useMemo(() => buildWeeks(month), [month]);
  const todayKey = dayKey(new Date());
  const selectedKey = dayKey(selected);

  const shiftMonth = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} accessibilityLabel="Mois précédent">
          <ChevronLeftIcon color={theme.colors.accent} size={20} />
        </Pressable>

        <Text style={styles.monthLabel}>
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>

        <Pressable onPress={() => shiftMonth(1)} hitSlop={10} accessibilityLabel="Mois suivant">
          <ChevronRightIcon color={theme.colors.accent} size={20} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, dayIndex) => {
            if (!day) return <View key={dayIndex} style={styles.cell} />;

            const key = dayKey(day);
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;

            return (
              <Pressable
                key={dayIndex}
                style={styles.cell}
                onPress={() => onSelect(startOfDay(day))}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={day.toLocaleDateString()}
              >
                <View style={[styles.dayShape, isSelected && styles.daySelected]}>
                  <Text
                    style={[
                      styles.dayNumber,
                      isToday && styles.dayToday,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View style={[styles.dot, markedDays.has(key) && styles.dotVisible]} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    calendar: {
      backgroundColor: theme.colors.surface,
      borderWidth: Math.max(theme.borderWidth, 1),
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.space.sm,
      gap: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.space.sm,
      paddingBottom: theme.space.sm,
    },
    monthLabel: { ...theme.text.heading, textTransform: 'capitalize' },
    week: { flexDirection: 'row' },
    weekday: { ...theme.text.label, flex: 1, textAlign: 'center', paddingBottom: theme.space.xs },
    cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
    dayShape: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    daySelected: { backgroundColor: theme.colors.accent },
    dayNumber: { ...theme.text.body, color: theme.colors.text },
    dayToday: { color: theme.colors.accent, fontWeight: '700' },
    dayNumberSelected: { color: theme.colors.onAccent, fontWeight: '600' },
    // Posée sous la pastille du jour, donc sur le fond de la carte : elle garde
    // l'accent même quand le jour est sélectionné.
    dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2, backgroundColor: 'transparent' },
    dotVisible: { backgroundColor: theme.colors.accent },
  });
