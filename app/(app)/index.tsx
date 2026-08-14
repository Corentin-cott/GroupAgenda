import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { Link, Stack, router, useFocusEffect } from 'expo-router';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme/colors';
import type { GroupMemberRecord } from '@/types/pocketbase';

export default function GroupsScreen() {
  const { user, signOut } = useAuth();
  const [memberships, setMemberships] = useState<GroupMemberRecord[]>([]);

  // Au focus et non au montage : la liste doit se rafraîchir au retour d'une
  // création de groupe ou d'une invitation acceptée.
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
            <Pressable onPress={signOut} hitSlop={8}>
              <Text style={styles.headerAction}>Déconnexion</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={memberships}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucun groupe pour l'instant. Crées-en un, ou ouvre le lien d'invitation qu'on t'a
            envoyé.
          </Text>
        }
        renderItem={({ item }) => (
          <Link href={`/group/${item.group}`} style={styles.row}>
            {item.expand?.group?.name ?? 'Groupe'}
          </Link>
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

const styles = StyleSheet.create({
  headerAction: { color: colors.accent },
  row: {
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
  },
  empty: { textAlign: 'center', marginTop: 32, color: colors.muted, lineHeight: 20 },
  cta: { marginTop: 12 },
});
