import { dayKey, formatDayLabel, parsePbDate, startOfDay } from '@/lib/date';

export interface DaySection<T> {
  key: string;
  title: string;
  past: boolean;
  data: T[];
}

/** Regroupe par journée locale et compte le passé, que l'appelant masque par défaut. */
export function buildDaySections<T>(
  items: T[],
  getStart: (item: T) => string,
  includePast: boolean,
): { sections: DaySection<T>[]; pastCount: number } {
  const today = startOfDay(new Date()).getTime();
  const sections: DaySection<T>[] = [];
  let pastCount = 0;

  for (const item of items) {
    const date = parsePbDate(getStart(item));
    if (!date) continue;

    const past = startOfDay(date).getTime() < today;
    if (past) pastCount += 1;
    if (past && !includePast) continue;

    const key = dayKey(date);
    const last = sections[sections.length - 1];
    if (last?.key === key) last.data.push(item);
    else sections.push({ key, title: formatDayLabel(date), past, data: [item] });
  }

  return { sections, pastCount };
}
