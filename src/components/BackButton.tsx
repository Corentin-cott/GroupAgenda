import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { HeaderButton } from './HeaderButton';
import { ChevronLeftIcon } from './icons';

/** Remonte d'un cran, ou rejoint `fallback` quand la pile est vide (lien ouvert directement). */
export function BackButton({ fallback }: { fallback: Href }) {
  return (
    <HeaderButton
      side="left"
      accessibilityLabel="Retour"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
    >
      {(color) => <ChevronLeftIcon color={color} />}
    </HeaderButton>
  );
}

/** Écran parent d'un chemin : l'agenda du groupe pour ses sous-écrans, l'accueil sinon. */
export function parentPath(pathname: string): Href | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  if (segments[0] === 'group' && segments.length > 2) {
    return `/group/${segments[1]}` as Href;
  }
  return '/' as Href;
}
