import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';

export type ThemeId = 'system' | 'light' | 'dark' | 'comfort' | 'contrast';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  separator: string;
  text: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  placeholder: string;
}

export interface ThemeText {
  title: TextStyle;
  heading: TextStyle;
  body: TextStyle;
  label: TextStyle;
  meta: TextStyle;
  button: TextStyle;
}

export interface Theme {
  id: Exclude<ThemeId, 'system'>;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  text: ThemeText;
  space: { xs: number; sm: number; md: number; lg: number; xl: number };
  radius: { sm: number; md: number; lg: number };
  borderWidth: number;
}

/** Piles système : rendu natif sur chaque plateforme, aucun asset à charger. */
export const fontFamilies = {
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  }) as string,
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
  }) as string,
};

interface TypographyConfig {
  family: string;
  scale: number;
  text: string;
  muted: string;
}

/** Une échelle unique, multipliée par le facteur du thème. */
export function buildText({ family, scale, text, muted }: TypographyConfig): ThemeText {
  const size = (base: number) => Math.round(base * scale);

  return {
    title: { fontFamily: family, fontSize: size(27), fontWeight: '600', color: text },
    heading: { fontFamily: family, fontSize: size(17), fontWeight: '600', color: text },
    body: { fontFamily: family, fontSize: size(16), lineHeight: size(23), color: text },
    label: { fontFamily: family, fontSize: size(13), fontWeight: '500', color: muted },
    meta: { fontFamily: family, fontSize: size(14), lineHeight: size(20), color: muted },
    button: { fontFamily: family, fontSize: size(16), fontWeight: '600' },
  };
}

export const baseSpace = { xs: 4, sm: 8, md: 12, lg: 20, xl: 32 };
export const baseRadius = { sm: 8, md: 12, lg: 18 };

export function scaleSpace(factor: number): Theme['space'] {
  return {
    xs: Math.round(baseSpace.xs * factor),
    sm: Math.round(baseSpace.sm * factor),
    md: Math.round(baseSpace.md * factor),
    lg: Math.round(baseSpace.lg * factor),
    xl: Math.round(baseSpace.xl * factor),
  };
}
