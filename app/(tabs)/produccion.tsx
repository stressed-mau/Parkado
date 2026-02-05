import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet
} from "react-native";

import { calcularRequerimientos } from "../../components/lib/modeloProduccion";

export default function ProduccionScreen() {

  const [macetas, setMacetas] = useState("50");
  const [tiempo, setTiempo] = useState("140");

  const [moldesManual, setMoldesManual] = useState<string>("");

  const objetivo = Number(macetas);
  const tiempoMin = Number(tiempo);

  const valido =
    objetivo > 0 &&
    tiempoMin > 0 &&
    !isNaN(objetivo) &&
    !isNaN(tiempoMin);

  const resultado = valido
    ? calcularRequerimientos(objetivo, tiempoMin)
    : null;

  const moldesFinales =
  moldesManual.trim() === ""
    ? resultado?.equipos?.moldesSugeridos
    : Number(moldesManual);


  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        Plan de producción
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Macetas a producir
        </Text>

        <TextInput
          value={macetas}
          onChangeText={setMacetas}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Tiempo disponible (min)
        </Text>

        <TextInput
          value={tiempo}
          onChangeText={setTiempo}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      {resultado && (

        <>
          {/* ---------------- PERSONAS ---------------- */}

          <View style={styles.block}>

            <Text style={styles.section}>
              👷 Personal requerido
            </Text>

            <Text style={styles.row}>Molienda: {resultado.personas.molienda}</Text>
            <Text style={styles.row}>Pesado: {resultado.personas.pesado}</Text>
            <Text style={styles.row}>Mezclado: {resultado.personas.mezclado}</Text>
            <Text style={styles.row}>Moldes: {resultado.personas.moldes}</Text>
            <Text style={styles.row}>Desmolde: {resultado.personas.desmolde}</Text>

          </View>

          {/* ---------------- EQUIPOS ---------------- */}

          <View style={styles.block}>

            <Text style={styles.section}>
              🏭 Equipos
            </Text>

            <Text style={styles.row}>
              Moledoras: {resultado.equipos.moledoras}
            </Text>

            <Text style={styles.row}>
              Balanzas: {resultado.equipos.balanzas}
            </Text>

            <View style={{ marginTop: 8 }}>

              <Text style={styles.label}>
                Moldes (sugerido: {resultado.equipos.moldesSugeridos})
              </Text>

              <TextInput
                placeholder="Usar sugerido"
                value={moldesManual}
                onChangeText={setMoldesManual}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#888"
              />

              <Text style={styles.hint}>
                Moldes usados en el plan: {moldesFinales}
              </Text>

            </View>

          </View>

          {/* ---------------- MATERIALES ---------------- */}

          <View style={styles.block}>

            <Text style={styles.section}>
              🧪 Material necesario
            </Text>

            <Text style={styles.row}>
              Cáscara: {resultado.materiales.cascara} g
            </Text>

            <Text style={styles.row}>
              Alginato: {resultado.materiales.alginato} g
            </Text>

            <Text style={styles.row}>
              Agua: {resultado.materiales.agua} g
            </Text>

          </View>

        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 16
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16
  },

  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  label: {
    color: "#111",
    marginBottom: 6,
    fontWeight: "500"
  },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    color: "#111",
    backgroundColor: "#fff"
  },

  block: {
    marginTop: 16,
    backgroundColor: "#ecfdf5",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#10b981"
  },

  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065f46",
    marginBottom: 8
  },

  row: {
    color: "#111",
    marginBottom: 4
  },

  hint: {
    marginTop: 6,
    color: "#065f46",
    fontSize: 12
  }
});
