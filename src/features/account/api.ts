import type { ImagePickerAsset } from 'expo-image-picker';
import { pb } from '@/lib/pocketbase';
import type { UserRecord } from '@/types/pocketbase';

export function updateName(userId: string, name: string): Promise<UserRecord> {
  return pb.collection('users').update(userId, { name: name.trim() });
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
};

// Jamais déduit de `uri` : sur le web c'est une data URL, dont le base64 n'a pas d'extension.
function safeFileName(asset: ImagePickerAsset): string {
  const provided = asset.fileName?.split(/[\\/]/).pop();
  if (provided && provided.length <= 100) return provided;
  return `avatar.${EXTENSIONS[asset.mimeType ?? ''] ?? 'jpg'}`;
}

export async function updateAvatar(userId: string, asset: ImagePickerAsset): Promise<UserRecord> {
  const form = new FormData();

  if (asset.file) {
    // Web : le sélecteur fournit un File natif, avec son nom et son type.
    form.append('avatar', asset.file);
  } else if (asset.uri.startsWith('data:') || asset.uri.startsWith('blob:')) {
    const blob = await (await fetch(asset.uri)).blob();
    form.append('avatar', blob, safeFileName(asset));
  } else {
    const part = {
      uri: asset.uri,
      name: safeFileName(asset),
      type: asset.mimeType ?? 'image/jpeg',
    };
    form.append('avatar', part as unknown as Blob);
  }

  return pb.collection('users').update(userId, form);
}

export function removeAvatar(userId: string): Promise<UserRecord> {
  return pb.collection('users').update(userId, { avatar: null });
}

export function avatarUrl(user: Pick<UserRecord, 'id' | 'collectionId' | 'avatar'>): string | null {
  if (!user.avatar) return null;
  return pb.files.getURL(user as never, user.avatar, { thumb: '160x160' });
}
