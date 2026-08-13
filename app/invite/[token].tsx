import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/providers/AuthProvider';
import { parsePbDate } from '@/lib/date';
import {
  InviteError,
  acceptInvite,
  fetchInvitePreview,
  type InvitePreview,
} from '@/features/groups/api';

type Status = 'loading' | 'ready' | 'joining' | 'failed';

const ERROR_MESSAGES: Record<string, string> = {
  'not-found': "Ce lien d'invitation n'existe pas ou a été révoqué.",
  expired: "Ce lien d'invitation a expiré. Demande à un membre du groupe d'en générer un nouveau.",
  network: 'Impossible de contacter le serveur. Vérifie ta connexion.',
};

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorReason, setErrorReason] = useState<string>('network');

  // L'aperçu ne demande pas de session : on ne renvoie vers le login qu'une
  // fois le lien reconnu valide. `user` en dépendance -> `alreadyMember` est
  // recalculé au retour de connexion.
  useEffect(() => {
    if (!token || isAuthLoading) return;
    let active = true;
    setStatus('loading');

    void (async () => {
      try {
        const data = await fetchInvitePreview(token);
        if (!active) return;
        setPreview(data);
        setStatus('ready');
      } catch (err) {
        if (!active) return;
        setErrorReason(err instanceof InviteError ? err.reason : 'network');
        setStatus('failed');
      }
    })();

    return () => {
      active = false;
    };
  }, [token, isAuthLoading, user?.id]);

  const onJoin = useCallback(async () => {
    if (!token || !preview) return;
    setStatus('joining');
    try {
      const { groupId } = await acceptInvite(token);
      router.replace(`/group/${groupId}`);
    } catch (err) {
      setErrorReason(err instanceof InviteError ? err.reason : 'network');
      setStatus('failed');
    }
  }, [token, preview]);

  if (status === 'loading' || isAuthLoading) {
    return (
      <Screen centered maxWidth={420}>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (status === 'failed') {
    return (
      <Screen centered maxWidth={420}>
        <Text style={styles.error}>{ERROR_MESSAGES[errorReason] ?? ERROR_MESSAGES.network}</Text>
        <Pressable style={styles.secondary} onPress={() => router.replace('/')} hitSlop={8}>
          <Text style={styles.secondaryLabel}>Retour à l'accueil</Text>
        </Pressable>
      </Screen>
    );
  }

  // Lien valide, visiteur non connecté : passage par l'authentification en
  // conservant l'URL, puis retour ici.
  if (!isAuthenticated || !user) {
    return <Redirect href={{ pathname: '/login', params: { redirect: `/invite/${token}` } }} />;
  }

  if (!preview) return null;

  const expiresAt = parsePbDate(preview.expires);
  const isMember = preview.alreadyMember;

  return (
    <Screen centered maxWidth={420} style={styles.card}>
      <Text style={styles.eyebrow}>Invitation</Text>
      <Text style={styles.title}>{preview.groupName}</Text>
      <Text style={styles.meta}>
        {preview.invitedBy ? `Invité par ${preview.invitedBy}` : 'Invitation partagée'}
        {` · ${preview.memberCount} membre${preview.memberCount > 1 ? 's' : ''}`}
      </Text>
      {expiresAt && (
        <Text style={styles.meta}>Valable jusqu'au {expiresAt.toLocaleDateString()}</Text>
      )}

      <Pressable
        style={[styles.primary, status === 'joining' && styles.primaryDisabled]}
        disabled={status === 'joining'}
        onPress={isMember ? () => router.replace(`/group/${preview.groupId}`) : onJoin}
      >
        {status === 'joining' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryLabel}>
            {isMember ? "Ouvrir l'agenda" : 'Rejoindre le groupe'}
          </Text>
        )}
      </Pressable>

      {isMember && <Text style={styles.meta}>Tu fais déjà partie de ce groupe.</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center' },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, color: '#888' },
  title: { fontSize: 26, fontWeight: '600', textAlign: 'center' },
  meta: { color: '#666', textAlign: 'center' },
  primary: {
    marginTop: 16,
    minHeight: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  primaryDisabled: { opacity: 0.6 },
  primaryLabel: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: { marginTop: 12, padding: 12 },
  secondaryLabel: { color: '#2563eb' },
  error: { color: '#c0392b', textAlign: 'center', lineHeight: 20 },
});
