import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'pref:';

export async function loadPreference(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export async function savePreference(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, value);
  } catch {
    // Préférence d'affichage : une écriture perdue ne justifie pas d'échouer.
  }
}
