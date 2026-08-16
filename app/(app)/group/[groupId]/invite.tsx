import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import {
  buildInviteUrl,
  createGroupInvite,
  getGroup,
  listGroupInvites,
  revokeGroupInvite,
  type ActiveInvite,
} from '@/features/groups/api';
import { confirmAction } from '@/lib/confirm';
import { parsePbDate } from '@/lib/date';
import { pbErrorMessage } from '@/lib/errors';
import { copyToClipboard, shareLink } from '@/lib/share';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';

export default function GroupInviteScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);

  const [groupName, setGroupName] = useState('');
  const [invites, setInvites] = useState<ActiveInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    let active = true;

    void (async () => {
      try {
        const [group, activeInvites] = await Promise.all([
          getGroup(groupId),
          listGroupInvites(groupId),
        ]);
        if (!active) return;
        setGroupName(group.name);
        setInvites(activeInvites);
      } catch (err) {
        if (active) setError(pbErrorMessage(err, 'Impossible de charger les liens actifs.'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [groupId]);

  const onGenerate = useCallback(async () => {
    if (!groupId || !user) return;
    setPending(true);
    setError(null);
    try {
      const { invite, url } = await createGroupInvite(groupId, user.id);
      setInvites((prev) => [
        {
          id: invite.id,
          token: invite.token,
          expires: invite.expires,
          created: invite.created,
          createdBy: invite.created_by,
        },
        ...prev,
      ]);
      await copyToClipboard(url);
      setNotice('Lien créé et copié dans le presse-papier.');
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de générer le lien.'));
    } finally {
      setPending(false);
    }
  }, [groupId, user]);

  const onShare = useCallback(
    async (invite: ActiveInvite) => {
      const outcome = await shareLink(
        buildInviteUrl(invite.token),
        `Rejoins « ${groupName} » sur GroupAgenda.`,
      );
      if (outcome === 'copied') setNotice('Lien copié dans le presse-papier.');
    },
    [groupName],
  );

  const onCopy = useCallback(async (invite: ActiveInvite) => {
    await copyToClipboard(buildInviteUrl(invite.token));
    setNotice('Lien copié dans le presse-papier.');
  }, []);

  const onRevoke = useCallback(async (invite: ActiveInvite) => {
    const confirmed = await confirmAction(
      'Révoquer ce lien ?',
      'Il cessera immédiatement de fonctionner. Les membres déjà arrivés restent dans le groupe.',
    );
    if (!confirmed) return;

    try {
      await revokeGroupInvite(invite.id);
      setInvites((prev) => prev.filter((item) => item.id !== invite.id));
      setNotice('Lien révoqué.');
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de révoquer ce lien.'));
    }
  }, []);

  if (isLoading) {
    return (
      <Screen centered>
        <Stack.Screen options={{ title: 'Inviter' }} />
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Inviter' }} />

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.hint}>
              Un lien reste valable 7 jours. Toute personne qui l'ouvre rejoint « {groupName} » avec
              les mêmes droits que toi.
            </Text>
            <PrimaryButton label="Générer un lien" onPress={onGenerate} pending={pending} />
            {!!notice && <Text style={styles.notice}>{notice}</Text>}
            {!!error && <Text style={styles.error}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun lien actif.</Text>}
        renderItem={({ item }) => {
          const expiresAt = parsePbDate(item.expires);
          return (
            <Card>
              <Text style={styles.url} numberOfLines={1} selectable>
                {buildInviteUrl(item.token)}
              </Text>
              <Text style={styles.meta}>
                {expiresAt ? `Expire le ${expiresAt.toLocaleDateString()}` : 'Expiration inconnue'}
              </Text>
              <View style={styles.actions}>
                <Pressable onPress={() => onCopy(item)} hitSlop={8}>
                  <Text style={styles.action}>Copier</Text>
                </Pressable>
                <Pressable onPress={() => onShare(item)} hitSlop={8}>
                  <Text style={styles.action}>Partager</Text>
                </Pressable>
                <Pressable onPress={() => onRevoke(item)} hitSlop={8}>
                  <Text style={[styles.action, styles.danger]}>Révoquer</Text>
                </Pressable>
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { gap: theme.space.sm },
    header: { gap: theme.space.md, paddingBottom: theme.space.lg },
    hint: theme.text.meta,
    notice: { ...theme.text.meta, color: theme.colors.accent },
    error: { ...theme.text.meta, color: theme.colors.danger },
    url: { ...theme.text.body, fontSize: (theme.text.meta.fontSize as number) + 1 },
    meta: theme.text.meta,
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.space.lg,
      marginTop: theme.space.sm,
    },
    action: { ...theme.text.body, color: theme.colors.accent },
    danger: { color: theme.colors.danger },
    empty: { ...theme.text.meta, textAlign: 'center' },
  });
