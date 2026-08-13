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
