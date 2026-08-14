import { Alert, Platform } from 'react-native';

/** `Alert` n'existe pas sur react-native-web : on y utilise `window.confirm`. */
export function confirmAction(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Confirmer', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
