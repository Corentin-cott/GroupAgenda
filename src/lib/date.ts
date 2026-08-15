/**
 * PocketBase sérialise ses dates en `2026-08-13 18:00:00.000Z` : un espace au
 * lieu du `T`, format hors spec ECMAScript. V8 l'accepte, Hermes et Safari
 * renvoient `Invalid Date`.
 */
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
