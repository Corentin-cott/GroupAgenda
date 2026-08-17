import { Image, StyleSheet, Text, View } from 'react-native';
import { avatarUrl } from '@/features/account/api';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { UserRecord } from '@/types/pocketbase';

interface AvatarProps {
  user: UserRecord | null | undefined;
  size?: number;
}

function initials(user: UserRecord | null | undefined): string {
  const source = user?.name?.trim() || user?.email || '?';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Initiales en repli : une image cassée est pire que pas d'image. */
export function Avatar({ user, size = 40 }: AvatarProps) {
  const styles = useThemedStyles(createStyles);
  const url = user ? avatarUrl(user) : null;
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (url) {
    return <Image source={{ uri: url }} style={[styles.image, shape]} accessibilityIgnoresInvertColors />;
  }

  return (
    <View style={[styles.fallback, shape]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(user)}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    image: { backgroundColor: theme.colors.surfaceAlt },
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.accentSoft,
    },
    initials: { color: theme.colors.accent, fontWeight: '600' },
  });
