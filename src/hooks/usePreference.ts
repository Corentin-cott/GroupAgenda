import { useCallback, useEffect, useState } from 'react';
import { loadPreference, savePreference } from '@/lib/preferences';

/** Préférence persistée. `allowed` doit être une constante de module pour rester stable. */
export function usePreference<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    let active = true;

    void loadPreference(key).then((stored) => {
      if (active && stored && (allowed as readonly string[]).includes(stored)) {
        setValue(stored as T);
      }
    });

    return () => {
      active = false;
    };
  }, [key, allowed]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      void savePreference(key, next);
    },
    [key],
  );

  return [value, update];
}
