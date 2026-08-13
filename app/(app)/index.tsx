import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Screen } from '@/components/Screen';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/providers/AuthProvider';
import type { GroupMemberRecord } from '@/types/pocketbase';

export default function GroupsScreen() {
  const { user, signOut } = useAuth();
  const [memberships, setMemberships] = useState<GroupMemberRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    void pb
      .collection('group_members')
      .getFullList({
        filter: pb.filter('user = {:userId}', { userId: user.id }),
        expand: 'group',
        requestKey: 'my_groups',
      })
      .then(setMemberships)
      .catch(() => setMemberships([]));
  }, [user]);

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
        ListEmptyComponent={<Text style={styles.empty}>Aucun groupe pour l'instant.</Text>}
        renderItem={({ item }) => (
          <Link href={`/group/${item.group}`} style={styles.row}>
            {item.expand?.group?.name ?? 'Groupe'}
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: { color: '#2563eb' },
  row: {
    paddingVertical: 14,
    fontSize: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' },
});
