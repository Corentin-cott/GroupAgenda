import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const AUTH_STORAGE_KEY = 'pb_auth';

export interface AuthStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// `window` est absent au rendu statique du build web.
const webStorage: AuthStorage = {
  async get(key) {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  async set(key, value) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  async remove(key) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

// SecureStore plafonne à ~2048 octets par entrée sur Android, or la payload
// PocketBase (JWT + record user) dépasse régulièrement : on découpe.
const CHUNK_SIZE = 1800;
const countKey = (key: string) => `${key}_count`;
const chunkKey = (key: string, i: number) => `${key}_${i}`;

async function readChunkCount(key: string): Promise<number> {
  const raw = await SecureStore.getItemAsync(countKey(key));
  const count = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(count) && count > 0 ? count : 0;
}

const nativeStorage: AuthStorage = {
  async get(key) {
    const count = await readChunkCount(key);
    if (count === 0) return null;

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
    );
    // Écriture partielle (crash entre deux chunks) : session considérée perdue.
    if (chunks.some((chunk) => chunk == null)) {
      await nativeStorage.remove(key);
      return null;
    }
    return chunks.join('');
  },

  async set(key, value) {
    await nativeStorage.remove(key);

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(chunkKey(key, i), chunk)));
    await SecureStore.setItemAsync(countKey(key), String(chunks.length));
  },

  async remove(key) {
    const count = await readChunkCount(key);
    await Promise.all([
      ...Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
      SecureStore.deleteItemAsync(countKey(key)),
    ]);
  },
};

export const authStorage: AuthStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
