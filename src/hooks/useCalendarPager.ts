import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const SETTLE_DELAY = 140;

/**
 * Pagination à trois volets, la période courante au centre.
 * La fin de geste est détectée à la main : `onMomentumScrollEnd` ne se déclenche
 * pas de façon fiable sur react-native-web.
 */
export function useCalendarPager(onShift: (delta: -1 | 1) => void) {
  const ref = useRef<ScrollView>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shift = useRef(onShift);
  shift.current = onShift;

  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const recenter = useCallback(() => {
    if (size.width > 0) ref.current?.scrollTo({ x: size.width, animated: false });
  }, [size.width]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize((previous) =>
      Math.abs(previous.width - width) > 1 || Math.abs(previous.height - height) > 1
        ? { width, height }
        : previous,
    );
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset } = event.nativeEvent;
    const width = layoutMeasurement.width;
    if (width <= 0) return;

    // Mesure toujours à jour, là où `onLayout` ne suit pas un redimensionnement web.
    setSize((previous) =>
      Math.abs(previous.width - width) > 1 || Math.abs(previous.height - layoutMeasurement.height) > 1
        ? { width, height: layoutMeasurement.height }
        : previous,
    );

    const offset = contentOffset.x;
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => {
      const page = Math.round(offset / width);
      // Geste trop court pour changer de période : on recolle au centre.
      if (page === 1) ref.current?.scrollTo({ x: width, animated: false });
      else shift.current(page === 0 ? -1 : 1);
    }, SETTLE_DELAY);
  }, []);

  return { ref, size, recenter, pagerProps: { onLayout, onScroll, scrollEventThrottle: 16 } };
}
