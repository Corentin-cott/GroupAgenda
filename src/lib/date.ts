/** PocketBase sépare date et heure par un espace : `Invalid Date` sur Hermes et Safari. */
export function parsePbDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toPbDate(date: Date): string {
  return date.toISOString().replace('T', ' ');
}

const pad = (value: number) => String(value).padStart(2, '0');

/** Format `YYYY-MM-DDTHH:mm` attendu par `<input type="datetime-local">`, en heure locale. */
export function toLocalInputValue(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function fromLocalInputValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Prochaine heure ronde : valeur par défaut raisonnable pour un nouvel événement. */
export function nextRoundHour(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 1, 0, 0, 0);
  return date;
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Lundi de la semaine contenant `date`. */
export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  return addDays(start, -((start.getDay() + 6) % 7));
}

/** Clé de regroupement stable en heure locale (`2026-08-17`). */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDayLabel(date: Date): string {
  const days = Math.round((startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days === -1) return 'Hier';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatEventDate(value: string | Date | null): string {
  const date = value instanceof Date ? value : parsePbDate(value);
  if (!date) return 'Date à définir';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
