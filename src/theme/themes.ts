import { StyleSheet } from 'react-native';
import {
  baseRadius,
  buildText,
  fontFamilies,
  scaleSpace,
  type Theme,
  type ThemeColors,
  type ThemeId,
} from './tokens';

const lightColors: ThemeColors = {
  background: '#FAF9F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EEE9',
  border: '#E4DFD8',
  separator: '#EDE9E3',
  text: '#1B1A1F',
  textMuted: '#6F6A78',
  accent: '#5B4BE0',
  accentSoft: '#EEEBFC',
  onAccent: '#FFFFFF',
  danger: '#C2453C',
  placeholder: '#A6A0AC',
};

const darkColors: ThemeColors = {
  background: '#131218',
  surface: '#1C1B23',
  surfaceAlt: '#26242F',
  border: '#2F2C3A',
  separator: '#282531',
  text: '#F4F2EF',
  textMuted: '#A29DAE',
  accent: '#9187FF',
  accentSoft: '#262138',
  onAccent: '#15131F',
  danger: '#FF8078',
  placeholder: '#6C6678',
};

/** Neutres purs et contrastes poussés : lisibilité avant esthétique. */
const contrastColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F0',
  border: '#1A1A1A',
  separator: '#1A1A1A',
  text: '#000000',
  textMuted: '#3A3A3A',
  accent: '#0B3BD6',
  accentSoft: '#E4EAFF',
  onAccent: '#FFFFFF',
  danger: '#A5140C',
  placeholder: '#5A5A5A',
};

function createTheme(
  id: Theme['id'],
  scheme: Theme['scheme'],
  colors: ThemeColors,
  options: { family?: string; fontScale?: number; spaceScale?: number; borderWidth?: number } = {},
): Theme {
  const { family = fontFamilies.sans, fontScale = 1, spaceScale = 1, borderWidth } = options;

  return {
    id,
    scheme,
    colors,
    text: buildText({ family, scale: fontScale, text: colors.text, muted: colors.textMuted }),
    space: scaleSpace(spaceScale),
    radius: baseRadius,
    borderWidth: borderWidth ?? StyleSheet.hairlineWidth,
  };
}

export const themes = {
  light: createTheme('light', 'light', lightColors),
  dark: createTheme('dark', 'dark', darkColors),
  comfort: createTheme('comfort', 'light', lightColors, {
    family: fontFamilies.serif,
    fontScale: 1.15,
    spaceScale: 1.25,
  }),
  contrast: createTheme('contrast', 'light', contrastColors, {
    fontScale: 1.05,
    borderWidth: 1.5,
  }),
} satisfies Record<Exclude<ThemeId, 'system'>, Theme>;

export interface ThemeOption {
  value: ThemeId;
  label: string;
  hint: string;
}

export const themeOptions: ThemeOption[] = [
  { value: 'system', label: 'Système', hint: "Suit le réglage clair/sombre de l'appareil." },
  { value: 'light', label: 'Clair', hint: 'Neutres chauds, accent violet.' },
  { value: 'dark', label: 'Sombre', hint: 'Fond profond, contrastes adoucis.' },
  { value: 'comfort', label: 'Confort', hint: "Texte plus grand, empattements, plus d'air." },
  { value: 'contrast', label: 'Contraste élevé', hint: 'Noir sur blanc, bordures marquées.' },
];

export function resolveTheme(id: ThemeId, systemScheme: 'light' | 'dark'): Theme {
  if (id === 'system') return systemScheme === 'dark' ? themes.dark : themes.light;
  return themes[id];
}
