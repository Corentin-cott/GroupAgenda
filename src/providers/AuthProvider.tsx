import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { pb, restoreAuthStore } from '@/lib/pocketbase';
import type { UserRecord } from '@/types/pocketbase';

interface AuthState {
  user: UserRecord | null;
  /** true tant que la session persistée n'a pas été restaurée/validée. */
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(input: { email: string; password: string; name?: string }): Promise<void>;
  signOut(): void;
  /** Recharge le record courant (ex. après édition du profil). */
  reload(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  useEffect(() => {
    let active = true;

    // L'authStore est la source de vérité : tout passe par onChange.
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (!active) return;
      setState((prev) => ({ ...prev, user: (record as UserRecord | null) ?? null }));
    });

    void (async () => {
      await restoreAuthStore();

      if (pb.authStore.isValid) {
        try {
          // Le token peut être périmé côté serveur : authRefresh valide et prolonge.
          await pb.collection('users').authRefresh({ requestKey: 'auth_refresh' });
        } catch {
          pb.authStore.clear();
        }
      }

      if (!active) return;
      setState({ user: (pb.authStore.record as UserRecord | null) ?? null, isLoading: false });
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await pb.collection('users').authWithPassword(email.trim(), password);
  }, []);

  const signUp = useCallback(
    async ({ email, password, name }: { email: string; password: string; name?: string }) => {
      const cleanEmail = email.trim();
      await pb.collection('users').create({
        email: cleanEmail,
        password,
        passwordConfirm: password,
        name: name?.trim() || cleanEmail.split('@')[0],
      });
      await pb.collection('users').authWithPassword(cleanEmail, password);
    },
    [],
  );

  const signOut = useCallback(() => {
    // Coupe aussi les abonnements SSE ouverts avec l'ancien token.
    void pb.realtime.unsubscribe();
    pb.authStore.clear();
  }, []);

  const reload = useCallback(async () => {
    if (!pb.authStore.isValid) return;
    await pb.collection('users').authRefresh({ requestKey: 'auth_refresh' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: state.user !== null,
      signIn,
      signUp,
      signOut,
      reload,
    }),
    [state, signIn, signUp, signOut, reload],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return context;
}
