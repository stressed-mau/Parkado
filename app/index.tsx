import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(tabs)/Mapa" />;
  // o si querés que abra directo en Mapa:
  // return <Redirect href="/(tabs)/Mapa" />;
}
