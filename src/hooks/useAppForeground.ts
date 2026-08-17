import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/** Rejoue `callback` au retour au premier plan : le flux temps réel a pu manquer des mutations. */
export function useAppForeground(callback: () => void): void {
  const latest = useRef(callback);
  latest.current = callback;

  useEffect(() => {
    let previous = AppState.currentState;

    const subscription = AppState.addEventListener('change', (next) => {
      if (previous.match(/inactive|background/) && next === 'active') latest.current();
      previous = next;
    });

    return () => subscription.remove();
  }, []);
}
