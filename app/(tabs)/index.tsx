import { Image } from "expo-image";
import { StyleSheet, View, Text } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

/* ===========================
   PALETA (azul – azul – azul – crema)
   =========================== */

const COLORS = {
  // tomados visualmente de tu imagen
  navy: "#1F3448",      // franja superior
  blue: "#5E7F99",      // franja 2
  lightBlue: "#A9C5D1", // franja 3
  cream: "#EFE5D2",     // franja inferior

  // derivados para UI
  background: "#F5F7F8",
  block: "#EFE5D2",
  border: "#A9C5D1",

  title: "#1F3448",
  text: "#243A4A",

  accent: "#5E7F99"
};

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: COLORS.navy, dark: COLORS.navy }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      {/* TÍTULO */}
      <ThemedView style={styles.titleContainer}>
        <Ionicons name="analytics" size={22} color={COLORS.accent} />
        <ThemedText type="title">Simulador de Producción</ThemedText>
      </ThemedView>

      {/* BLOQUE DESCRIPCIÓN */}
      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <MaterialCommunityIcons
            name="calculator-variant"
            size={18}
            color={COLORS.accent}
          />
          <Text style={styles.sectionText}>¿Qué hace este simulador?</Text>
        </View>

        <Text style={styles.text}>
          Este simulador permite planificar la producción diaria de macetas
          biodegradables calculando automáticamente el personal por proceso,
          los equipos requeridos y el consumo de materiales. Además, genera un
          plan por grupos de trabajo, muestra indicadores de carga por proceso,
          balance de personal y compara la producción real contra el objetivo
          diario mediante gráficos.
        </Text>
      </View>

      {/* BLOQUE USO */}
      <View style={styles.block}>
        <View style={styles.sectionRow}>
          <Ionicons name="list" size={18} color={COLORS.accent} />
          <Text style={styles.sectionText}>¿Cómo usarlo?</Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
          <Text style={styles.text}>
            Ingresa el número total de personas disponibles para la jornada.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
          <Text style={styles.text}>
            Define el tiempo de trabajo por día y los días del periodo a
            analizar.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
          <Text style={styles.text}>
            Establece la meta diaria de macetas a producir.
          </Text>
        </View>

        <View style={styles.listItem}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.accent} />
          <Text style={styles.text}>
            Revisa el plan automático por grupos, la distribución de personas
            por proceso, el balance de personal y los indicadores visuales de
            producción.
          </Text>
        </View>
      </View>

      {/* LOGO AL FINAL */}
      <View style={styles.footerLogo}>
        <Image
          source={{ uri: "https://i.imgur.com/yUhrmMq.png" }}
          style={styles.logo}
          contentFit="contain"
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
    marginBottom: 12
  },

  block: {
    marginTop: 16,
    backgroundColor: COLORS.block,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6
  },

  sectionText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.title
  },

  text: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6
  },

  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
    opacity: 0.07,
    tintColor: COLORS.lightBlue
  },

  footerLogo: {
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4
  },

  logo: {
    width: 560,
    height: 460,
    resizeMode: "contain",
    opacity: 0.95
  }
});
