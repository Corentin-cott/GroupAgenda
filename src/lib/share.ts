import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled';

export async function copyToClipboard(value: string): Promise<void> {
  await Clipboard.setStringAsync(value);
}

/** Feuille de partage native, `navigator.share` sur le web, copie sinon. */
export async function shareLink(url: string, message: string): Promise<ShareOutcome> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: message, url });
        return 'shared';
      } catch {
        // Partage annulé ou refusé : on retombe sur la copie.
      }
    }
    await copyToClipboard(url);
    return 'copied';
  }

  const result = await Share.share({ message: `${message}\n${url}` });
  return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
}
