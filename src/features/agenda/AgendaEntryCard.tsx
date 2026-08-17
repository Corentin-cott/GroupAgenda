import { StyleSheet, Text, View } from 'react-native';
import { AttendingCheck } from '@/components/AttendingCheck';
import { Card } from '@/components/Card';
import { formatTime, parsePbDate } from '@/lib/date';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { AgendaEntry } from './types';

interface AgendaEntryCardProps {
  entry: AgendaEntry;
  onPress?: () => void;
  dimmed?: boolean;
}

function badgeLabel(entry: AgendaEntry): string {
  if (!entry.visible) return 'Détails masqués';
  if (entry.source === 'personal') return 'Personnel';
  return entry.groupName ?? 'Groupe';
}

export function AgendaEntryCard({ entry, onPress, dimmed }: AgendaEntryCardProps) {
  const styles = useThemedStyles(createStyles);
  const date = parsePbDate(entry.start);

  return (
    <Card onPress={onPress} style={dimmed ? styles.dimmed : undefined}>
      <View style={styles.row}>
        <Text style={[styles.title, !entry.visible && styles.titleHidden]}>{entry.title}</Text>
        {entry.attending && <AttendingCheck />}
      </View>

      <Text style={styles.meta}>{date ? formatTime(date) : 'Heure à définir'}</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>{badgeLabel(entry)}</Text>
      </View>
    </Card>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    dimmed: { opacity: 0.6 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.sm },
    title: { ...theme.text.heading, flex: 1 },
    titleHidden: { color: theme.colors.textMuted, fontStyle: 'italic' },
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
