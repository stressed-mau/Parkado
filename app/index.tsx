import { Redirect } from 'expo-router';

export default function Index() {
  // Redirige automáticamente a la pantalla de Login dentro de los tabs
  return <Redirect href="/(tabs)/Mapa" />;
}