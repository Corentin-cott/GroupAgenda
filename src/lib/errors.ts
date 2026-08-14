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

  // Jamais le message brut du serveur : « File not found. », « Failed to create
  // record. » ne veulent rien dire pour l'utilisateur. Seul le détail par champ
  // est exploitable, sinon c'est à l'appelant de dire ce qui a échoué.
  const [fieldError] = Object.values(pbFieldErrors(err));
  return fieldError ?? fallback;
}
