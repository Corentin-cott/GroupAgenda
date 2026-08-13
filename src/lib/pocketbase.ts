import PocketBase, { AsyncAuthStore } from 'pocketbase';
import type { TypedPocketBase } from '@/types/pocketbase';
import { AUTH_STORAGE_KEY, authStorage } from './auth-storage';
import { installEventSourcePolyfill } from './event-source';

installEventSourcePolyfill();

const baseUrl = process.env.EXPO_PUBLIC_POCKETBASE_URL;
if (!baseUrl) {
  throw new Error('EXPO_PUBLIC_POCKETBASE_URL manquant (cf. .env.example)');
}

// `initial` n'est pas utilisé : AsyncAuthStore le charge dans une file interne,
// sans moyen de savoir quand la restauration est terminée. On la pilote nous-mêmes.
const authStore = new AsyncAuthStore({
  save: (serialized) => authStorage.set(AUTH_STORAGE_KEY, serialized),
  clear: () => authStorage.remove(AUTH_STORAGE_KEY),
});

export const pb = new PocketBase(baseUrl, authStore) as TypedPocketBase;

// L'annulation est gérée explicitement via `requestKey`.
pb.autoCancellation(false);

let restorePromise: Promise<void> | null = null;

/** Recharge le token persisté dans l'authStore. Idempotent. */
export function restoreAuthStore(): Promise<void> {
  restorePromise ??= (async () => {
    try {
      const raw = await authStorage.get(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { token?: string; record?: unknown; model?: unknown };
      if (parsed.token) {
        pb.authStore.save(parsed.token, (parsed.record ?? parsed.model) as never);
      }
    } catch {
      await authStorage.remove(AUTH_STORAGE_KEY);
    }
  })();
  return restorePromise;
}
