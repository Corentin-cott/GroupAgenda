import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { HeaderButton } from '@/components/HeaderButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { UserPlusIcon } from '@/components/icons';
import { getGroup, leaveGroup, listGroupMembers } from '@/features/groups/api';
import { confirmAction } from '@/lib/confirm';
import { pbErrorMessage } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { GroupMemberRecord, UserRecord } from '@/types/pocketbase';

function memberLabel(member: GroupMemberRecord, currentUser: UserRecord | null): string {
  const expanded = member.expand?.user;

  if (currentUser && member.user === currentUser.id) {
    return `${currentUser.name || expanded?.name || currentUser.email} (Toi)`;
  }
  return expanded?.name || expanded?.email || 'Un membre';
}

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);

  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<GroupMemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    let active = true;

    void (async () => {
      try {
        const [group, list] = await Promise.all([getGroup(groupId), listGroupMembers(groupId)]);
        if (!active) return;
        setGroupName(group.name);
        setMembers(list);
      } catch (err) {
        if (active) setError(pbErrorMessage(err, 'Impossible de charger les membres.'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [groupId]);

  const onLeave = async () => {
    const membership = members.find((member) => member.user === user?.id);
    if (!membership) return;

    const isLast = members.length === 1;
    const confirmed = await confirmAction(
      'Quitter ce groupe ?',
      isLast
        ? `Tu en es le dernier membre : « ${groupName} » et tous ses événements seront supprimés.`
        : "Tu perdras l'accès à son agenda. Il faudra une nouvelle invitation pour revenir.",
    );
    if (!confirmed) return;

    setPending(true);
    try {
      await leaveGroup(membership.id);
      router.replace('/');
    } catch (err) {
      setError(pbErrorMessage(err, 'Impossible de quitter le groupe.'));
      setPending(false);
    }
  };

  const screenOptions = {
    title: 'Membres',
    headerRight: () => (
      <HeaderButton
        onPress={() => router.push(`/group/${groupId}/invite`)}
        accessibilityLabel="Inviter quelqu'un dans le groupe"
      >
        {(color) => <UserPlusIcon color={color} />}
      </HeaderButton>
    ),
  };

  if (isLoading) {
    return (
      <Screen centered>
        <Stack.Screen options={screenOptions} />
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={screenOptions} />

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.hint}>
            {members.length} membre{members.length > 1 ? 's' : ''} · tous ont les mêmes droits sur
            l'agenda.
          </Text>
        }
        ListEmptyComponent={<Text style={styles.hint}>Aucun membre.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.member}>
            <Avatar user={item.expand?.user} size={40} />
            <Text style={styles.name}>{memberLabel(item, user)}</Text>
          </Card>
        )}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.footer}>
        <PrimaryButton
          label="Quitter le groupe"
          variant="outline"
          pending={pending}
          onPress={onLeave}
        />
      </View>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { gap: theme.space.sm },
    hint: { ...theme.text.meta, marginBottom: theme.space.sm },
    member: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
    name: { ...theme.text.body, flex: 1 },
    error: { ...theme.text.meta, color: theme.colors.danger, marginTop: theme.space.sm },
    footer: { marginTop: theme.space.md },
  });
