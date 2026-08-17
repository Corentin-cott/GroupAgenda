import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { Card } from '@/components/Card';
import { PrimaryButton } from '@/components/PrimaryButton';
import { HeaderButton } from '@/components/HeaderButton';
import { Screen } from '@/components/Screen';
import { SettingsIcon } from '@/components/icons';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/providers/AuthProvider';
import { useThemedStyles } from '@/theme/ThemeProvider';
import type { Theme } from '@/theme/tokens';
import type { GroupMemberRecord } from '@/types/pocketbase';

export default function GroupsScreen() {
  const { user } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [memberships, setMemberships] = useState<GroupMemberRecord[]>([]);

  // Au focus : la liste doit refléter un groupe créé ou une invitation acceptée.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let active = true;

      void pb
        .collection('group_members')
        .getFullList({
          filter: pb.filter('user = {:userId}', { userId: user.id }),
          expand: 'group',
          requestKey: 'my_groups',
        })
        .then((records) => {
          if (active) setMemberships(records);
        })
        .catch(() => {
          if (active) setMemberships([]);
        });

      return () => {
        active = false;
      };
    }, [user]),
  );

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: 'Mes groupes',
          headerRight: () => (
            <HeaderButton onPress={() => router.push('/settings')} accessibilityLabel="Réglages">
              {(color) => <SettingsIcon color={color} />}
            </HeaderButton>
          ),
        }}
      />

      <Card onPress={() => router.push('/agenda')}>
        <Text style={styles.agendaTitle}>Mon agenda</Text>
      </Card>

      <View style={styles.separator} />

      <FlatList
        data={memberships}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucun groupe pour l'instant. Crées-en un, ou ouvre le lien d'invitation qu'on t'a
            envoyé.
          </Text>
        }
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/group/${item.group}`)}>
            <Text style={styles.groupName}>{item.expand?.group?.name ?? 'Groupe'}</Text>
          </Card>
        )}
      />

      <PrimaryButton
        label="Nouveau groupe"
        onPress={() => router.push('/group/new')}
        style={styles.cta}
      />
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    agendaTitle: theme.text.heading,
    separator: {
      height: Math.max(theme.borderWidth, 1),
      backgroundColor: theme.colors.separator,
      marginVertical: theme.space.lg,
    },
    list: { gap: theme.space.sm },
    groupName: theme.text.heading,
    empty: { ...theme.text.meta, textAlign: 'center', marginTop: theme.space.xl },
    cta: { marginTop: theme.space.md },
  });
