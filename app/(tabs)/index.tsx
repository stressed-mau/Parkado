import { Image } from "expo-image";
import { StyleSheet, View, Text } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#ecfdf5", dark: "#064e3b" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      {/* TÍTULO */}
      <ThemedView style={styles.titleContainer}>
        <Ionicons name="analytics" size={22} color="#047857" />
        <ThemedText type="title">Simulador de Producción</ThemedText>
      </ThemedView>

      {/* BLOQUE DESCRIPCIÓN */}
      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons
            name="calculator-variant"
            size={18}
            color="#065f46"
          />
          <Text style={styles.sectionText}>¿Qué hace esta calculadora?</Text>
        </View>

        <Text style={styles.text}>
          Simula la producción de macetas biodegradables y calcula
          automáticamente el personal, equipos y materiales necesarios según el
          tiempo disponible y la meta de producción.
        </Text>
      </View>

      {/* BLOQUE USO */}
      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="list" size={18} color="#065f46" />
          <Text style={styles.sectionText}>¿Cómo usarla?</Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.text}>
            Ingresa la cantidad de macetas a producir.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.text}>
            Ingresa el tiempo disponible en minutos.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.text}>
            Ajusta los moldes disponibles si deseas.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.text}>
            Revisa el personal, equipos y material calculados automáticamente.
          </Text>
        </View>
      </View>

      {/* BLOQUE ACCESO */}
      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons
            name="rocket-launch"
            size={18}
            color="#065f46"
            
          />
          <Text style={styles.sectionText}>Ir al simulador</Text>
        </View>

        <Link href="/produccion">
          <View style={styles.linkCard}>
            <Ionicons name="play" size={20} color="#047857" />
            <Text style={styles.linkText}>
              Abrir calculadora de producción
            </Text>
          </View>
        </Link>
      </View>

      {/* LOGO AL FINAL */}
<View style={styles.footerLogo}>
  <Image
    source={{ uri: "https://i.imgur.com/yUhrmMq.png" }}
    style={styles.logo}
    contentFit="cover"
  />
</View>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  block: {
    marginTop: 16,
    backgroundColor: "#ecfdf5",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#10b981",
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },

  sectionText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065f46",
  },

  text: {
    color: "#064e3b",
    fontSize: 14,
    lineHeight: 20,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  linkCard: {
    marginTop: 4,
    
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },

  linkText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#047857",
  },

  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
    opacity: 0.25,
  },

  footerLogo: {
  marginTop: 0,
  alignItems: "center",
  justifyContent: "center",
  paddingBottom: 10
},



logo: {
  width: 460,
  height: 340,
  resizeMode: "contain",
  opacity: 0.9
}


});
