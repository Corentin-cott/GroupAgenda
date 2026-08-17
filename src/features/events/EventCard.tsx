import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import type { EventRsvpSummary } from '@/hooks/useGroupRsvpSummary';
import { formatTime, parsePbDate } from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { EventRecord } from '@/types/pocketbase';

interface EventCardProps {
  event: EventRecord;
  summary?: EventRsvpSummary;
  onPress: () => void;
  dimmed?: boolean;
}

export function EventCard({ event, summary, onPress, dimmed }: EventCardProps) {
  const styles = useThemedStyles(createStyles);
  const { count, attending } = summary ?? { count: 0, attending: false };
  const date = parsePbDate(event.start_date);

  return (
    <Card onPress={onPress} style={dimmed ? styles.dimmed : undefined}>
      <View style={styles.row}>
        <Text style={styles.title}>{event.title}</Text>
        {attending && (
          <View style={styles.check} accessibilityLabel="Tu es inscrit à cet événement">
            <Text style={styles.checkMark}>✓</Text>
          </View>
        )}
      </View>

      <Text style={styles.meta}>{date ? formatTime(date) : 'Heure à définir'}</Text>

      {event.type === 'rsvp' && (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>
            {count} inscrit{count > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Card>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    dimmed: { opacity: 0.6 },
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
  });
