import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { loadPreference, savePreference } from '@/lib/preferences';
import { resolveTheme, themeOptions } from './themes';
import type { Theme, ThemeId } from './tokens';

const STORAGE_KEY = 'theme';

interface ThemeContextValue {
  theme: Theme;
  themeId: ThemeId;
  setThemeId(id: ThemeId): void;
  /** false tant que le choix persisté n'est pas relu. */
  isReady: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeId = (value: string | null): value is ThemeId =>
  !!value && themeOptions.some((option) => option.value === value);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [themeId, setThemeIdState] = useState<ThemeId>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    void loadPreference(STORAGE_KEY).then((stored) => {
      if (!active) return;
      if (isThemeId(stored)) setThemeIdState(stored);
      setIsReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    void savePreference(STORAGE_KEY, id);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: resolveTheme(themeId, systemScheme), themeId, setThemeId, isReady }),
    [themeId, systemScheme, setThemeId, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme doit être utilisé dans <ThemeProvider>');
  return context;
}

/** Reconstruit les styles au changement de thème. Fabrique au niveau module pour rester stable. */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
