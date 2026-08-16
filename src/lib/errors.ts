import { ClientResponseError } from 'pocketbase';

interface PbFieldError {
  code?: string;
  message?: string;
}

/** Erreurs de validation par champ (`{ email: "..." }`) renvoyées par PocketBase. */
export function pbFieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ClientResponseError)) return {};

  const fields = err.response?.data as Record<string, PbFieldError> | undefined;
  if (!fields) return {};

  const result: Record<string, string> = {};
  for (const [field, detail] of Object.entries(fields)) {
    if (detail?.message) result[field] = detail.message;
  }
  return result;
}

export function pbErrorMessage(err: unknown, fallback = 'Une erreur est survenue.'): string {
  if (!(err instanceof ClientResponseError)) return fallback;

  if (__DEV__) console.warn('[pb]', err.status, err.response?.message ?? err.message);

  if (err.status === 0) return 'Serveur injoignable. Vérifie ta connexion.';

  // Jamais le message brut du serveur : illisible. Seul le détail par champ l'est.
  const [fieldError] = Object.values(pbFieldErrors(err));
  return fieldError ?? fallback;
}
